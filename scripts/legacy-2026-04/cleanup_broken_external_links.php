<?php
// Run inside inf-app container.
// Reads /tmp/broken_links.json (built by audit_external_links.php)
// and removes <a> tags pointing to those URLs from generated_articles.content_html.
// Only acts on hard 404/410 — skips 403/5xx/timeouts to avoid false positives.
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dryRun = !in_array('--apply', $argv ?? [], true);
echo $dryRun ? "=== DRY RUN ===\n" : "=== APPLYING ===\n";

$broken = json_decode(file_get_contents('/tmp/broken_links.json'), true) ?? [];
echo "loaded " . count($broken) . " broken entries\n";

// Only act on 404/410 — leave 403 (bot blocked but exists) and 5xx alone.
$dropUrls = [];
foreach ($broken as $b) {
    if ($b['code'] === '404' || $b['code'] === 404 || $b['code'] === '410' || $b['code'] === 410) {
        $dropUrls[$b['url']] = true;
    }
}
echo "actionable (404/410): " . count($dropUrls) . " distinct URLs\n";

if (empty($dropUrls)) { echo "nothing to do\n"; exit; }

// Find articles whose HTML mentions any of these URLs
$articles = DB::table('generated_articles')
    ->whereNotNull('content_html')
    ->select('id', 'content_html')
    ->get();

$totalAnchorsRemoved = 0;
$articlesTouched = 0;

foreach ($articles as $a) {
    $html = $a->content_html;
    if (!$html) continue;

    $modified = false;
    $localCount = 0;
    foreach ($dropUrls as $badUrl => $_) {
        $quotedUrl = preg_quote($badUrl, '/');
        // Match <a href="...badUrl..." ...>...</a>
        $pattern = '/<a\s+[^>]*href=["\']' . $quotedUrl . '["\'][^>]*>.*?<\/a>\s*/is';
        $newHtml = preg_replace($pattern, '', $html, -1, $n);
        if ($newHtml !== null && $n > 0) {
            $html = $newHtml;
            $localCount += $n;
            $modified = true;
        }
        // Also drop <li><a href="badUrl">...</a></li> entirely
        $liPattern = '/<li>\s*<a\s+[^>]*href=["\']' . $quotedUrl . '["\'][^>]*>.*?<\/a>\s*<\/li>\s*/is';
        $newHtml2 = preg_replace($liPattern, '', $html, -1, $n2);
        if ($newHtml2 !== null && $n2 > 0) {
            $html = $newHtml2;
            $localCount += $n2;
            $modified = true;
        }
    }

    if ($modified) {
        $articlesTouched++;
        $totalAnchorsRemoved += $localCount;
        echo "  article#{$a->id}: removed $localCount anchor(s)\n";
        if (!$dryRun) {
            DB::table('generated_articles')->where('id', $a->id)->update(['content_html' => $html]);
        }
    }
}

// Also delete the dead rows from external_link_registry
$idsToDelete = [];
foreach ($broken as $b) {
    if ($b['code'] === '404' || $b['code'] === 404 || $b['code'] === '410' || $b['code'] === 410) {
        $idsToDelete[] = $b['id'];
    }
}
echo "\nregistry rows to delete: " . count($idsToDelete) . "\n";
if (!$dryRun && !empty($idsToDelete)) {
    DB::table('external_link_registry')->whereIn('id', $idsToDelete)->delete();
    echo "deleted from external_link_registry\n";
}

echo "\n=== SUMMARY ===\n";
echo "articles_touched=$articlesTouched\n";
echo "total_anchors_removed=$totalAnchorsRemoved\n";
