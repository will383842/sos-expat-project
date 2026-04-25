<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::table('country_directory')
    ->where('is_active', true)
    ->select('id', 'url', 'country_code', 'category')
    ->get();

echo "Auditing " . count($rows) . " country_directory entries...\n";

$results = ['ok' => 0, '404' => 0, 'other_4xx' => 0, '5xx' => 0, 'timeout' => 0, 'connect_fail' => 0];
$broken404 = [];

$mh = curl_multi_init();

foreach (array_chunk($rows->toArray(), 30) as $batch) {
    $handles = [];
    foreach ($batch as $row) {
        $ch = curl_init($row->url);
        curl_setopt_array($ch, [
            CURLOPT_NOBODY => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        ]);
        curl_multi_add_handle($mh, $ch);
        $handles[] = ['ch' => $ch, 'row' => $row];
    }

    do { curl_multi_exec($mh, $running); curl_multi_select($mh, 0.3); } while ($running > 0);

    foreach ($handles as $h) {
        $code = curl_getinfo($h['ch'], CURLINFO_HTTP_CODE);
        $errno = curl_errno($h['ch']);
        $row = $h['row'];

        if ($errno === CURLE_OPERATION_TIMEDOUT) {
            $results['timeout']++;
        } elseif ($errno !== 0) {
            $results['connect_fail']++;
        } elseif ($code === 404 || $code === 410) {
            $results['404']++;
            $broken404[] = ['id' => $row->id, 'code' => $code, 'url' => $row->url, 'cc' => $row->country_code, 'cat' => $row->category];
        } elseif ($code >= 400 && $code < 500) {
            $results['other_4xx']++;
        } elseif ($code >= 500) {
            $results['5xx']++;
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
echo "broken_404_total: " . count($broken404) . " / " . count($rows) . "\n";

file_put_contents('/tmp/cd_broken_404.json', json_encode($broken404));
echo "\n=== SAMPLE 15 BROKEN ===\n";
foreach (array_slice($broken404, 0, 15) as $b) {
    echo "  id={$b['id']} [{$b['code']}] {$b['cc']}/{$b['cat']} {$b['url']}\n";
}
