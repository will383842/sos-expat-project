<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedArticle;
use App\Models\InternalLink;
use Illuminate\Support\Facades\DB;

// Two scans:
//   A) Articles whose injected internal links point to a different country
//      (via the InternalLink table — definitive source)
//   B) Articles whose content_html contains href to /xx-yy/ where yy != article country

echo "=== SCAN A: InternalLink table — cross-country links ===\n";
$rows = DB::select("
    SELECT il.source_id AS src_id, sa.country AS src_country, sa.title AS src_title,
           il.target_id AS tgt_id, ta.country AS tgt_country, ta.title AS tgt_title
      FROM internal_links il
      JOIN generated_articles sa ON sa.id = il.source_id
      JOIN generated_articles ta ON ta.id = il.target_id
     WHERE sa.country IS NOT NULL
       AND ta.country IS NOT NULL
       AND sa.country <> ta.country
       AND sa.parent_article_id IS NULL
     ORDER BY sa.id
");
echo "cross_country_link_count=" . count($rows) . "\n";
$bySrc = [];
foreach ($rows as $r) {
    $bySrc[$r->src_id] = ($bySrc[$r->src_id] ?? 0) + 1;
}
echo "distinct_source_articles_affected=" . count($bySrc) . "\n";
foreach (array_slice($rows, 0, 15) as $r) {
    echo "  src#{$r->src_id}({$r->src_country}) → tgt#{$r->tgt_id}({$r->tgt_country}) | "
       . substr($r->src_title, 0, 50) . " → " . substr($r->tgt_title, 0, 40) . "\n";
}

echo "\n=== SCAN B: content_html contains href to /xx-yy/ where yy != country ===\n";
$articles = GeneratedArticle::whereNull('parent_article_id')
    ->whereNotNull('country')
    ->where('word_count', '>', 0)
    ->whereNotNull('content_html')
    ->get(['id', 'country', 'language', 'title', 'content_html']);

$badLinkArticles = [];
foreach ($articles as $a) {
    $articleCountry = strtolower($a->country);
    // Find all locale prefixes in content_html
    if (preg_match_all('#href=["\']https?://(?:www\.)?sos-expat\.com/([a-z]{2})-([a-z]{2})/#i', $a->content_html, $m)) {
        $foreignCountries = [];
        foreach ($m[2] as $linkCountry) {
            $linkCountry = strtolower($linkCountry);
            if ($linkCountry !== $articleCountry && $linkCountry !== 'fr') {
                // exclude generic 'fr' fallback (often a default)
                $foreignCountries[$linkCountry] = ($foreignCountries[$linkCountry] ?? 0) + 1;
            }
        }
        if (!empty($foreignCountries)) {
            $badLinkArticles[] = [
                'id' => $a->id,
                'country' => $a->country,
                'title' => substr($a->title, 0, 60),
                'foreign' => $foreignCountries,
            ];
        }
    }
}

echo "articles_with_foreign_links=" . count($badLinkArticles) . " / " . $articles->count() . " total\n";
foreach (array_slice($badLinkArticles, 0, 20) as $b) {
    $foreignStr = implode(',', array_map(fn($c,$n) => "$c×$n", array_keys($b['foreign']), $b['foreign']));
    echo "  #{$b['id']}({$b['country']}) → [$foreignStr] | {$b['title']}\n";
}
