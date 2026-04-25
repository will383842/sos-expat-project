<?php
// Run inside blog-app container.
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dryRun = !in_array('--apply', $argv ?? [], true);
echo $dryRun ? "=== DRY RUN ===\n" : "=== APPLYING ===\n";

$broken = json_decode(file_get_contents('/tmp/broken_links.json'), true) ?? [];
$dropUrls = [];
foreach ($broken as $b) {
    if ($b['code'] === '404' || $b['code'] === 404 || $b['code'] === '410' || $b['code'] === 410) {
        $dropUrls[$b['url']] = true;
    }
}
echo "actionable URLs (404/410): " . count($dropUrls) . "\n";
if (empty($dropUrls)) exit;

// Walk all article_translations whose HTML mentions any bad URL
$rows = DB::table('article_translations')
    ->where('is_published', true)
    ->select('id', 'content_html')
    ->get();

echo "scanning " . count($rows) . " translations\n";

$totalRemoved = 0;
$rowsTouched = 0;

foreach ($rows as $r) {
    $html = $r->content_html;
    if (!$html) continue;

    $modified = false;
    $localCount = 0;
    foreach ($dropUrls as $badUrl => $_) {
        // Skip URLs that aren't even in this row (cheap filter)
        if (strpos($html, $badUrl) === false) continue;

        $quotedUrl = preg_quote($badUrl, '/');
        // Match <li><a ...badUrl...>...</a></li> first (sources lists)
        $liPattern = '/<li>\s*<a\s+[^>]*href=["\']' . $quotedUrl . '["\'][^>]*>.*?<\/a>\s*<\/li>\s*/is';
        $newHtml = preg_replace($liPattern, '', $html, -1, $n);
        if ($newHtml !== null && $n > 0) {
            $html = $newHtml;
            $localCount += $n;
            $modified = true;
        }
        // Then any remaining <a> tags
        $aPattern = '/<a\s+[^>]*href=["\']' . $quotedUrl . '["\'][^>]*>.*?<\/a>\s*/is';
        $newHtml2 = preg_replace($aPattern, '', $html, -1, $n2);
        if ($newHtml2 !== null && $n2 > 0) {
            $html = $newHtml2;
            $localCount += $n2;
            $modified = true;
        }
    }

    if ($modified) {
        $rowsTouched++;
        $totalRemoved += $localCount;
        if (!$dryRun) {
            DB::table('article_translations')->where('id', $r->id)->update(['content_html' => $html]);
        }
    }
}

echo "\n=== SUMMARY ===\n";
echo "translations_touched=$rowsTouched\n";
echo "total_anchors_removed=$totalRemoved\n";
