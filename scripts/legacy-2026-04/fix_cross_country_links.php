<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedArticle;
use App\Models\InternalLink;
use Illuminate\Support\Facades\DB;

$dryRun = in_array('--apply', $argv ?? [], true) ? false : true;
echo $dryRun ? "=== DRY RUN (pass --apply to execute) ===\n" : "=== APPLYING CHANGES ===\n";

// Step 0: Fix article 712 country if still wrong
$a712 = GeneratedArticle::find(712);
if ($a712 && $a712->country === 'CH' && stripos($a712->title, 'Irlande du Nord') !== false) {
    echo "Step 0: article 712 country CH → GB\n";
    if (!$dryRun) $a712->update(['country' => 'GB']);
}

// Step 1: Fetch all cross-country links
$rows = DB::select("
    SELECT il.id AS link_id, il.source_id, il.target_id, il.anchor_text,
           sa.country AS src_country, ta.country AS tgt_country,
           ta.slug AS tgt_slug, ta.language AS tgt_lang
      FROM internal_links il
      JOIN generated_articles sa ON sa.id = il.source_id
      JOIN generated_articles ta ON ta.id = il.target_id
     WHERE sa.country IS NOT NULL AND ta.country IS NOT NULL
       AND sa.country <> ta.country
       AND sa.parent_article_id IS NULL
");

echo "Found " . count($rows) . " cross-country links to clean\n\n";

$bySrc = [];
foreach ($rows as $r) {
    $bySrc[$r->source_id][] = $r;
}

foreach ($bySrc as $srcId => $links) {
    $article = GeneratedArticle::find($srcId);
    if (!$article || empty($article->content_html)) continue;

    $html = $article->content_html;
    $modified = false;

    foreach ($links as $link) {
        // Match <a href="...{tgt_slug}...">anchor</a> and replace with bare anchor text
        // Use the slug as the unique identifier in the href.
        $slug = preg_quote($link->tgt_slug ?? '', '/');
        if (empty($slug)) continue;

        $pattern = '/<a\s+[^>]*href=["\'][^"\']*' . $slug . '[^"\']*["\'][^>]*>(.*?)<\/a>/is';
        $newHtml = preg_replace($pattern, '$1', $html);

        if ($newHtml !== null && $newHtml !== $html) {
            $html = $newHtml;
            $modified = true;
            echo "  src#{$srcId}({$link->src_country}): removed <a> to #{$link->target_id}({$link->tgt_country}) slug={$link->tgt_slug}\n";
        } else {
            echo "  src#{$srcId}: no <a> match for slug={$link->tgt_slug} (will still drop link row)\n";
        }

        if (!$dryRun) {
            DB::table('internal_links')->where('id', $link->link_id)->delete();
        }
    }

    if ($modified && !$dryRun) {
        $article->update(['content_html' => $html]);
    }
}

echo "\nDone.\n";
