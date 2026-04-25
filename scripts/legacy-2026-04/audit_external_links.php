<?php
// Run inside inf-app container.
// Audits external_link_registry by sending HEAD requests in parallel.
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$urls = DB::table('external_link_registry')
    ->select('id', 'url', 'domain', 'trust_score')
    ->get();

echo "Auditing " . count($urls) . " distinct registry entries...\n";

$results = ['ok' => 0, '404' => 0, 'other_4xx' => 0, '5xx' => 0, 'timeout' => 0, 'connect_fail' => 0];
$broken = [];

// Use cURL multi for parallelism
$mh = curl_multi_init();
$handles = [];
$batchSize = 20;

foreach (array_chunk($urls->toArray(), $batchSize) as $batch) {
    $handles = [];
    foreach ($batch as $row) {
        $ch = curl_init($row->url);
        curl_setopt_array($ch, [
            CURLOPT_NOBODY => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SOS-Expat-LinkAuditor/1.0)',
        ]);
        curl_multi_add_handle($mh, $ch);
        $handles[(int)$ch] = ['ch' => $ch, 'row' => $row];
    }

    do {
        curl_multi_exec($mh, $running);
        curl_multi_select($mh, 0.5);
    } while ($running > 0);

    foreach ($handles as $h) {
        $code = curl_getinfo($h['ch'], CURLINFO_HTTP_CODE);
        $errno = curl_errno($h['ch']);
        $row = $h['row'];

        if ($errno === CURLE_OPERATION_TIMEDOUT) {
            $results['timeout']++;
            $broken[] = ['id' => $row->id, 'code' => 'TIMEOUT', 'url' => $row->url, 'domain' => $row->domain];
        } elseif ($errno !== 0) {
            $results['connect_fail']++;
            $broken[] = ['id' => $row->id, 'code' => "ERR{$errno}", 'url' => $row->url, 'domain' => $row->domain];
        } elseif ($code === 404) {
            $results['404']++;
            $broken[] = ['id' => $row->id, 'code' => '404', 'url' => $row->url, 'domain' => $row->domain];
        } elseif ($code >= 400 && $code < 500) {
            $results['other_4xx']++;
            $broken[] = ['id' => $row->id, 'code' => $code, 'url' => $row->url, 'domain' => $row->domain];
        } elseif ($code >= 500) {
            $results['5xx']++;
            $broken[] = ['id' => $row->id, 'code' => $code, 'url' => $row->url, 'domain' => $row->domain];
        } else {
            $results['ok']++;
        }

        curl_multi_remove_handle($mh, $h['ch']);
        curl_close($h['ch']);
    }
}
curl_multi_close($mh);

echo "\n=== RESULTS ===\n";
foreach ($results as $k => $v) echo "  $k: $v\n";
echo "broken_total: " . count($broken) . " / " . count($urls) . " (" . round(count($broken) / max(1, count($urls)) * 100, 1) . "%)\n";

echo "\n=== TOP 10 BROKEN BY DOMAIN ===\n";
$byDomain = [];
foreach ($broken as $b) $byDomain[$b['domain']] = ($byDomain[$b['domain']] ?? 0) + 1;
arsort($byDomain);
foreach (array_slice($byDomain, 0, 10, true) as $d => $n) echo "  $d : $n\n";

echo "\n=== SAMPLE 15 BROKEN URLS ===\n";
foreach (array_slice($broken, 0, 15) as $b) {
    echo "  [{$b['code']}] {$b['url']}\n";
}

// Persist for cleanup script
file_put_contents('/tmp/broken_links.json', json_encode($broken));
echo "\n→ Saved broken list to /tmp/broken_links.json\n";
