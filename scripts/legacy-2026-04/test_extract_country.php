<?php
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$job = new App\Jobs\GenerateFromSourceJob('fiche-pays');
$ref = new ReflectionClass($job);
$m = $ref->getMethod('extractCountryFromText');
$m->setAccessible(true);

$tests = [
    'Les Différents Types de Visas en Nouvelle-Calédonie 2026',
    'Divorce Expatrié en Irlande du Nord : Recours',
    'Vivre en Suisse comme expatrié',
    'Travailler au Vietnam : guide',
    'Étudier au Japon : démarches',
    'Random title without geo',
    'France : guide expatrié',
];
foreach ($tests as $t) {
    echo str_pad($t, 60) . ' => ' . ($m->invoke($job, $t) ?? 'NULL') . PHP_EOL;
}
