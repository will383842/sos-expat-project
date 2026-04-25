<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedArticle;
use App\Services\Content\QualityGuardService;
use App\Services\Content\ArticleImprovementService;

$articleId = (int) ($argv[1] ?? 278);
$a = GeneratedArticle::find($articleId);
if (!$a) { echo "article $articleId not found"; exit; }

$qg = app(QualityGuardService::class);
$result = $qg->check($a);

echo "=== BEFORE article={$articleId} ===\n";
echo "score={$result['score']}\n";
preg_match('/<p[^>]*>(.*?)<\/p>/is', $a->content_html, $m);
$firstPWords = isset($m[1]) ? str_word_count(strip_tags($m[1])) : 0;
echo "first_p_words={$firstPWords}\n";
$existingLinks = preg_match_all('/href=["\']https?:\/\/(sos-expat\.com|blog\.life-expat\.com)/i', $a->content_html);
echo "internal_links={$existingLinks}\n";
echo "word_count={$a->word_count}\n";
echo "ai_summary=" . (empty($a->ai_summary) ? 'EMPTY' : 'set:' . mb_strlen($a->ai_summary) . 'chars') . "\n";

echo "\n=== APPLYING IMPROVEMENT ===\n";
$startTime = microtime(true);
$improver = app(ArticleImprovementService::class);
$newResult = $improver->improve($a, $result);
$elapsed = round(microtime(true) - $startTime, 1);

echo "\n=== AFTER (took {$elapsed}s) ===\n";
echo "score={$newResult['score']}\n";
echo "applied=" . implode(',', $newResult['improvements_applied'] ?? []) . "\n";
$a->refresh();
preg_match('/<p[^>]*>(.*?)<\/p>/is', $a->content_html, $m);
$firstPWords = isset($m[1]) ? str_word_count(strip_tags($m[1])) : 0;
echo "first_p_words={$firstPWords}\n";
$newLinks = preg_match_all('/href=["\']https?:\/\/(sos-expat\.com|blog\.life-expat\.com)/i', $a->content_html);
echo "internal_links={$newLinks}\n";
echo "word_count={$a->word_count}\n";
echo "ai_summary=" . (empty($a->ai_summary) ? 'EMPTY' : 'set:' . mb_strlen($a->ai_summary) . 'chars: "' . mb_substr($a->ai_summary, 0, 100) . '"') . "\n";
echo "new_warnings_count=" . count($newResult['warnings'] ?? []) . "\n";
foreach ($newResult['warnings'] ?? [] as $w) echo "  WARN: " . substr($w, 0, 80) . "\n";

echo "\n=== FINAL DELTA ===\n";
echo "score: {$result['score']} → {$newResult['score']} (delta: " . ($newResult['score'] - $result['score']) . ")\n";
