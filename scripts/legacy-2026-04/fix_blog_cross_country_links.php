<?php
// Run inside blog-app container.
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$dryRun = !in_array('--apply', $argv ?? [], true);
echo $dryRun ? "=== DRY RUN (pass --apply) ===\n" : "=== APPLYING ===\n";

// Build per-article country set (an article may have multiple legitimate countries)
$countryMap = [];
foreach (DB::select("SELECT article_id, lower(country_code) AS cc FROM article_countries") as $r) {
    $countryMap[$r->article_id][$r->cc] = true;
}

// Pull all published translations with HTML containing locale-prefixed links
$rows = DB::select("
    SELECT id, article_id, language_code, slug, content_html
      FROM article_translations
     WHERE content_html LIKE '%href=%sos-expat.com/%-%/%'
       AND is_published = true
");

echo "Scanning " . count($rows) . " translations against multi-country sets...\n";

$totalLinksRemoved = 0;
$translationsModified = 0;

foreach ($rows as $r) {
    $allowedCountries = $countryMap[$r->article_id] ?? [];
    if (empty($allowedCountries)) continue;

    $html = $r->content_html;
    $linksRemovedHere = 0;

    // Strip <a> only when the link's country is NOT in this article's country set
    // (i.e. genuinely off-topic). 'fr' is allowed as a generic default.
    $newHtml = preg_replace_callback(
        '/<a\s+[^>]*href=["\']https?:\/\/(?:www\.)?sos-expat\.com\/([a-z]{2})-([a-z]{2})\/[^"\']*["\'][^>]*>(.*?)<\/a>/is',
        function ($m) use ($allowedCountries, &$linksRemovedHere) {
            $linkCountry = strtolower($m[2]);
            if (isset($allowedCountries[$linkCountry]) || $linkCountry === 'fr') {
                return $m[0]; // legit — keep
            }
            $linksRemovedHere++;
            return $m[3]; // off-topic — strip to bare anchor text
        },
        $html
    );

    if ($linksRemovedHere > 0 && $newHtml !== null) {
        $totalLinksRemoved += $linksRemovedHere;
        $translationsModified++;
        $countriesStr = implode(',', array_keys($allowedCountries));
        echo "  trans#{$r->id} article={$r->article_id} {$r->language_code}/[{$countriesStr}] slug={$r->slug}: removed $linksRemovedHere link(s)\n";
        if (!$dryRun) {
            DB::table('article_translations')
                ->where('id', $r->id)
                ->update(['content_html' => $newHtml]);
        }
    }
}

echo "\n=== SUMMARY ===\n";
echo "translations_modified=$translationsModified\n";
echo "total_links_removed=$totalLinksRemoved\n";
