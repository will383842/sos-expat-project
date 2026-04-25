<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedArticle;
use Illuminate\Support\Facades\DB;

$a = GeneratedArticle::find(692);
if (!$a) { echo "not found\n"; exit; }

echo "=== ARTICLE 692 ===\n";
echo "title: {$a->title}\n";
echo "country: {$a->country}\n";
echo "language: {$a->language}\n";
echo "source_slug: {$a->source_slug}\n";
echo "source_article_id: {$a->source_article_id}\n";
echo "keywords_primary: {$a->keywords_primary}\n";
echo "created_at: {$a->created_at}\n";
echo "featured_image_url: " . substr($a->featured_image_url ?? 'NULL', 0, 100) . "\n";
echo "---\n";

echo "content_excerpt:\n" . substr(strip_tags($a->content_html ?? ''), 0, 400) . "\n";
echo "---\n";

// Find first 3 internal links in content
preg_match_all('/href="([^"]+sos-expat\.com[^"]+)"/i', $a->content_html ?? '', $links);
echo "internal_links_count: " . count($links[1] ?? []) . "\n";
foreach (array_slice($links[1] ?? [], 0, 5) as $l) echo "  -> $l\n";
echo "---\n";

// Find images in content
preg_match_all('/<img[^>]+src="([^"]+)"/i', $a->content_html ?? '', $imgs);
echo "inline_images_count: " . count($imgs[1] ?? []) . "\n";
foreach (array_slice($imgs[1] ?? [], 0, 3) as $i) echo "  -> " . substr($i, 0, 100) . "\n";
echo "---\n";

// Source item
if ($a->source_article_id) {
    $item = DB::table('generation_source_items')->where('id', $a->source_article_id)->first();
    if ($item) {
        echo "=== SOURCE ITEM ===\n";
        foreach ((array) $item as $k => $v) {
            if (is_string($v) && mb_strlen($v) > 200) $v = mb_substr($v, 0, 200) . '...';
            echo "  $k=" . ($v ?? 'NULL') . "\n";
        }
    }
}
