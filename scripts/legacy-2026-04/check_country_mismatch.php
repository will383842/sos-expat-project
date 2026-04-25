<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedArticle;
use Illuminate\Support\Facades\DB;

// Country names → ISO codes mapping (the 50 most common)
$countryMap = [
    'france' => 'FR', 'belgique' => 'BE', 'suisse' => 'CH', 'canada' => 'CA',
    'maroc' => 'MA', 'espagne' => 'ES', 'allemagne' => 'DE', 'portugal' => 'PT',
    'thaïlande' => 'TH', 'thailande' => 'TH', 'états-unis' => 'US', 'etats-unis' => 'US',
    'royaume-uni' => 'GB', 'angleterre' => 'GB', 'émirats' => 'AE', 'emirats' => 'AE',
    'italie' => 'IT', 'pays-bas' => 'NL', 'australie' => 'AU', 'tunisie' => 'TN',
    'sénégal' => 'SN', 'senegal' => 'SN', 'côte d\'ivoire' => 'CI', 'cote d\'ivoire' => 'CI',
    'cameroun' => 'CM', 'madagascar' => 'MG', 'mali' => 'ML', 'burkina' => 'BF',
    'niger' => 'NE', 'tchad' => 'TD', 'congo' => 'CG', 'gabon' => 'GA',
    'djibouti' => 'DJ', 'comores' => 'KM', 'maurice' => 'MU', 'luxembourg' => 'LU',
    'monaco' => 'MC', 'nouvelle-calédonie' => 'NC', 'nouvelle-caledonie' => 'NC',
    'polynésie' => 'PF', 'polynesie' => 'PF', 'mayotte' => 'YT', 'réunion' => 'RE',
    'reunion' => 'RE', 'martinique' => 'MQ', 'guadeloupe' => 'GP', 'guyane' => 'GF',
    'japon' => 'JP', 'chine' => 'CN', 'inde' => 'IN', 'brésil' => 'BR',
    'bresil' => 'BR', 'mexique' => 'MX', 'argentine' => 'AR', 'russie' => 'RU',
    'turquie' => 'TR', 'grèce' => 'GR', 'grece' => 'GR', 'pologne' => 'PL',
    'autriche' => 'AT', 'irlande' => 'IE', 'norvège' => 'NO', 'suède' => 'SE',
    'finlande' => 'FI', 'danemark' => 'DK',
];

$articles = GeneratedArticle::whereNull('parent_article_id')
    ->where('language', 'fr')
    ->where('word_count', '>', 0)
    ->whereNotNull('country')
    ->get(['id', 'title', 'country']);

$mismatched = [];
foreach ($articles as $a) {
    $titleLower = mb_strtolower($a->title);
    foreach ($countryMap as $name => $iso) {
        if (str_contains($titleLower, $name)) {
            // Title mentions this country — does the DB country match?
            if (strtoupper($a->country) !== $iso) {
                $mismatched[] = [
                    'id' => $a->id,
                    'title' => $a->title,
                    'db_country' => $a->country,
                    'detected_country' => $iso,
                    'detected_name' => $name,
                ];
                break;
            }
        }
    }
}

echo "total_fr_articles_with_country=" . $articles->count() . "\n";
echo "mismatched=" . count($mismatched) . "\n";
echo "---first 10 mismatches---\n";
foreach (array_slice($mismatched, 0, 10) as $m) {
    echo "id={$m['id']} db={$m['db_country']} should_be={$m['detected_country']}({$m['detected_name']}) | " . substr($m['title'], 0, 70) . "\n";
}

// Group by source country mismatch
echo "\n---mismatch by source DB country---\n";
$bySource = [];
foreach ($mismatched as $m) {
    $key = $m['db_country'] . '→' . $m['detected_country'];
    $bySource[$key] = ($bySource[$key] ?? 0) + 1;
}
arsort($bySource);
foreach (array_slice($bySource, 0, 10, true) as $k => $v) {
    echo "  $k : $v\n";
}
