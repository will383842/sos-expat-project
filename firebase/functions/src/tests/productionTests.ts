// firebase/functions/src/tests/productionTests.ts

import {
  toCents,
  fromCents,
  eurosToCents, // Pour compatibilité
  centsToEuros, // Pour compatibilité
  validateAmount,
  calculateSplit,
  formatAmount,
  isSuspiciousAmount} from '../utils/paymentValidators';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Helper pour afficher les résultats
 */
function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}`);
  if (details) {
    console.log(`      ${colors.cyan}→ ${details}${colors.reset}`);
  }
}

/**
 * Test unitaire avec gestion d'erreur
 */
async function runTest(name: string, testFn: () => void | Promise<void>): Promise<boolean> {
  try {
    await testFn();
    logTest(name, true);
    return true;
  } catch (error) {
    logTest(name, false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Suite de tests critiques pour la production avec multi-devises
 */
export async function runCriticalTests(): Promise<boolean> {
  console.log(`\n${colors.bright}${colors.blue}🧪 TESTS CRITIQUES DE PRODUCTION (MULTI-DEVISES)${colors.reset}\n`);
  
  const results: boolean[] = [];
  
  // =====================================
  // 1. TESTS DE CONVERSION EUR
  // =====================================
  console.log(`${colors.yellow}📊 Tests de Conversion EUR (Euros/Centimes):${colors.reset}`);
  
  results.push(await runTest('Conversion 49€ → 4900 centimes', () => {
    const cents = toCents(49, 'eur');
    if (cents !== 4900) throw new Error(`Expected 4900, got ${cents}`);
  }));
  
  results.push(await runTest('Conversion 19€ → 1900 centimes', () => {
    const cents = toCents(19, 'eur');
    if (cents !== 1900) throw new Error(`Expected 1900, got ${cents}`);
  }));
  
  results.push(await runTest('Conversion inverse 4900 → 49€', () => {
    const euros = fromCents(4900, 'eur');
    if (euros !== 49) throw new Error(`Expected 49, got ${euros}`);
  }));

  // =====================================
  // 2. TESTS DE CONVERSION USD  
  // =====================================
  console.log(`\n${colors.yellow}💲 Tests de Conversion USD (Dollars/Cents):${colors.reset}`);
  
  results.push(await runTest('Conversion 55$ → 5500 cents', () => {
    const cents = toCents(55, 'usd');
    if (cents !== 5500) throw new Error(`Expected 5500, got ${cents}`);
  }));
  
  results.push(await runTest('Conversion 25$ → 2500 cents', () => {
    const cents = toCents(25, 'usd');
    if (cents !== 2500) throw new Error(`Expected 2500, got ${cents}`);
  }));
  
  results.push(await runTest('Conversion inverse 5500 → 55$', () => {
    const dollars = fromCents(5500, 'usd');
    if (dollars !== 55) throw new Error(`Expected 55, got ${dollars}`);
  }));
  
  // =====================================
  // 3. TESTS DE VALIDATION EUR
  // =====================================
  console.log(`\n${colors.yellow}💰 Tests de Validation EUR:${colors.reset}`);
  
  results.push(await runTest('Montant avocat valide EUR (49€)', () => {
    const result = validateAmount(49, 'lawyer', 'eur');
    if (!result.valid) throw new Error(result.error);
  }));
  
  results.push(await runTest('Montant expat valide EUR (19€)', () => {
    const result = validateAmount(19, 'expat', 'eur');
    if (!result.valid) throw new Error(result.error);
  }));
  
  // ⚠️ Ce test suppose un warning si l’écart dépasse la TOLERANCE.
  results.push(await runTest('Montant avec warning EUR (55€ pour avocat)', () => {
    const result = validateAmount(55, 'lawyer', 'eur');
    if (!result.valid) throw new Error('Should be valid with warning');
    if (!result.warning) throw new Error('Should have warning');
  }));

  // =====================================
  // 4. TESTS DE VALIDATION USD
  // =====================================
  console.log(`\n${colors.yellow}💲 Tests de Validation USD:${colors.reset}`);
  
  results.push(await runTest('Montant avocat valide USD (55$)', () => {
    const result = validateAmount(55, 'lawyer', 'usd');
    if (!result.valid) throw new Error(result.error);
  }));
  
  results.push(await runTest('Montant expat valide USD (25$)', () => {
    const result = validateAmount(25, 'expat', 'usd');
    if (!result.valid) throw new Error(result.error);
  }));
  
  results.push(await runTest('Montant avec warning USD (70$ pour avocat)', () => {
    const result = validateAmount(70, 'lawyer', 'usd');
    if (!result.valid) throw new Error('Should be valid with warning');
    if (!result.warning) throw new Error('Should have warning');
  }));
  
  // =====================================
  // 5. TESTS DE RÉPARTITION EUR (Frais Fixes)
  // =====================================
  console.log(`\n${colors.yellow}🔄 Tests de Répartition EUR (Frais Fixes):${colors.reset}`);
  
  results.push(await runTest('Répartition avocat 49€ (19€ frais fixes)', async () => {
    const split = await calculateSplit(49, 'lawyer', 'eur');
    if (split.connectionFeeAmount !== 19) throw new Error(`Frais: expected 19€, got ${split.connectionFeeAmount}€`);
    if (split.providerAmount !== 30) throw new Error(`Provider: expected 30€, got ${split.providerAmount}€`);
    if (!split.isValid) throw new Error('Split should be valid');
  }));

  results.push(await runTest('Répartition expat 19€ (9€ frais fixes)', async () => {
    const split = await calculateSplit(19, 'expat', 'eur');
    if (split.connectionFeeAmount !== 9) throw new Error(`Frais: expected 9€, got ${split.connectionFeeAmount}€`);
    if (split.providerAmount !== 10) throw new Error(`Provider: expected 10€, got ${split.providerAmount}€`);
    if (!split.isValid) throw new Error('Split should be valid');
  }));

  // =====================================
  // 6. TESTS DE RÉPARTITION USD (Frais Fixes)
  // =====================================
  console.log(`\n${colors.yellow}💲 Tests de Répartition USD (Frais Fixes):${colors.reset}`);
  
  results.push(await runTest('Répartition avocat 55$ (25$ frais fixes)', async () => {
    const split = await calculateSplit(55, 'lawyer', 'usd');
    if (split.connectionFeeAmount !== 25) throw new Error(`Frais: expected 25$, got ${split.connectionFeeAmount}$`);
    if (split.providerAmount !== 30) throw new Error(`Provider: expected 30$, got ${split.providerAmount}$`);
    if (!split.isValid) throw new Error('Split should be valid');
  }));
  
  results.push(await runTest('Répartition expat 25$ (15$ frais fixes)', async () => {
    const split = await calculateSplit(25, 'expat', 'usd');
    if (split.connectionFeeAmount !== 15) throw new Error(`Frais: expected 15$, got ${split.connectionFeeAmount}$`);
    if (split.providerAmount !== 10) throw new Error(`Provider: expected 10$, got ${split.providerAmount}$`);
    if (!split.isValid) throw new Error('Split should be valid');
  }));
  
  // =====================================
  // 7. TESTS DE FORMATAGE
  // =====================================
  console.log(`\n${colors.yellow}📝 Tests de Formatage:${colors.reset}`);
  
  results.push(await runTest('Format 49€', () => {
    const formatted = formatAmount(49, 'eur');
    if (!formatted.includes('49') || !formatted.includes('€')) {
      throw new Error(`Invalid format: ${formatted}`);
    }
  }));
  
  results.push(await runTest('Format 55$', () => {
    const formatted = formatAmount(55, 'usd');
    if (!formatted.includes('55') || !formatted.includes('$')) {
      throw new Error(`Invalid format: ${formatted}`);
    }
  }));
  
  // =====================================
  // 8. TESTS ANTI-FRAUDE MULTI-DEVISES
  // =====================================
  console.log(`\n${colors.yellow}🔒 Tests Anti-Fraude Multi-devises:${colors.reset}`);
  
  results.push(await runTest('Montant normal EUR non suspect', () => {
    const result = isSuspiciousAmount(49, 'lawyer', 'eur');
    if (result.suspicious) throw new Error(`Should not be suspicious: ${result.reasons.join(', ')}`);
  }));
  
  results.push(await runTest('Montant normal USD non suspect', () => {
    const result = isSuspiciousAmount(55, 'lawyer', 'usd');
    if (result.suspicious) throw new Error(`Should not be suspicious: ${result.reasons.join(', ')}`);
  }));
  
  results.push(await runTest('Montant très différent USD suspect', () => {
    const result = isSuspiciousAmount(100, 'lawyer', 'usd'); // 55$ attendu
    if (!result.suspicious) throw new Error('Should detect large deviation');
  }));

  // =====================================
  // 9. TESTS COMPATIBILITÉ ANCIENNES FONCTIONS
  // =====================================
  console.log(`\n${colors.yellow}🔄 Tests Compatibilité (anciennes fonctions):${colors.reset}`);
  
  results.push(await runTest('eurosToCents compatibilité', () => {
    const cents = eurosToCents(49);
    if (cents !== 4900) throw new Error(`Expected 4900, got ${cents}`);
  }));
  
  results.push(await runTest('centsToEuros compatibilité', () => {
    const euros = centsToEuros(4900);
    if (euros !== 49) throw new Error(`Expected 49, got ${euros}`);
  }));
  
  // =====================================
  // RÉSUMÉ
  // =====================================
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  const total = results.length;
  const allPassed = failed === 0;
  
  console.log(`\n${colors.bright}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}📊 RÉSUMÉ DES TESTS MULTI-DEVISES${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}`);
  console.log(`  ${colors.green}✅ Réussis: ${passed}/${total}${colors.reset}`);
  if (failed > 0) {
    console.log(`  ${colors.red}❌ Échoués: ${failed}/${total}${colors.reset}`);
  }
  console.log(`${colors.bright}${'='.repeat(50)}${colors.reset}\n`);
  
  if (allPassed) {
    console.log(`${colors.green}${colors.bright}🎉 TOUS LES TESTS MULTI-DEVISES SONT PASSÉS ! Le système EUR/USD est prêt pour la production.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}⚠️ ATTENTION : ${failed} test(s) ont échoué. Corrigez les erreurs avant la mise en production.${colors.reset}\n`);
  }
  
  return allPassed;
}

/**
 * TEST D'INTÉGRATION FRAIS FIXES (corrigé)
 */
export async function runIntegrationTest(): Promise<void> {
  console.log(`\n${colors.bright}${colors.blue}🔗 TEST D'INTÉGRATION FRAIS FIXES${colors.reset}\n`);
  
  // Simulation EUR
  console.log('  Simulation paiement avocat EUR (49€)...');
  const validationEur = await validateAmount(49, 'lawyer', 'eur');
  if (!validationEur.valid) {
    console.log(`  ${colors.red}❌ Validation EUR échouée: ${validationEur.error}${colors.reset}`);
    return;
  }
  console.log(`  ${colors.green}✓${colors.reset} Montant EUR validé`);
  
  const splitEur = await calculateSplit(49, 'lawyer', 'eur');
  console.log(`  ${colors.green}✓${colors.reset} Répartition EUR:`);
  console.log(`     • Total: ${formatAmount(splitEur.totalAmount, 'eur')}`);
  console.log(`     • Frais de mise en relation: ${formatAmount(splitEur.connectionFeeAmount, 'eur')}`);
  console.log(`     • Rémunération prestataire: ${formatAmount(splitEur.providerAmount, 'eur')}`);
  
  // Simulation USD
  console.log('\n  Simulation paiement avocat USD (55$)...');
  const validationUsd = await validateAmount(55, 'lawyer', 'usd');
  if (!validationUsd.valid) {
    console.log(`  ${colors.red}❌ Validation USD échouée: ${validationUsd.error}${colors.reset}`);
    return;
  }
  console.log(`  ${colors.green}✓${colors.reset} Montant USD validé`);
  
  const splitUsd = await calculateSplit(55, 'lawyer', 'usd');
  console.log(`  ${colors.green}✓${colors.reset} Répartition USD:`);
  console.log(`     • Total: ${formatAmount(splitUsd.totalAmount, 'usd')}`);
  console.log(`     • Frais de mise en relation: ${formatAmount(splitUsd.connectionFeeAmount, 'usd')}`);
  console.log(`     • Rémunération prestataire: ${formatAmount(splitUsd.providerAmount, 'usd')}`);
  
  // Test expat EUR
  console.log('\n  Simulation paiement expat EUR (19€)...');
  const splitExpatEur = await calculateSplit(19, 'expat', 'eur');
  console.log(`  ${colors.green}✓${colors.reset} Répartition Expat EUR:`);
  console.log(`     • Total: ${formatAmount(splitExpatEur.totalAmount, 'eur')}`);
  console.log(`     • Frais de mise en relation: ${formatAmount(splitExpatEur.connectionFeeAmount, 'eur')}`);
  console.log(`     • Rémunération prestataire: ${formatAmount(splitExpatEur.providerAmount, 'eur')}`);
  
  // Test expat USD
  console.log('\n  Simulation paiement expat USD (25$)...');
  const splitExpatUsd = await calculateSplit(25, 'expat', 'usd');
  console.log(`  ${colors.green}✓${colors.reset} Répartition Expat USD:`);
  console.log(`     • Total: ${formatAmount(splitExpatUsd.totalAmount, 'usd')}`);
  console.log(`     • Frais de mise en relation: ${formatAmount(splitExpatUsd.connectionFeeAmount, 'usd')}`);
  console.log(`     • Rémunération prestataire: ${formatAmount(splitExpatUsd.providerAmount, 'usd')}`);
  
  console.log(`\n  ${colors.green}${colors.bright}✅ Parcours d'intégration frais fixes complété avec succès${colors.reset}`);
  console.log(`\n  ${colors.cyan}📊 Résumé des frais:${colors.reset}`);
  console.log(`     • Avocat EUR: 19€ de frais sur 49€ (38.8%)`);
  console.log(`     • Avocat USD: 25$ de frais sur 55$ (45.5%)`);
  console.log(`     • Expat EUR: 9€ de frais sur 19€ (47.4%)`);
  console.log(`     • Expat USD: 15$ de frais sur 25$ (60.0%)`);
}

/**
 * Test de performance multi-devises
 */
export async function runPerformanceTest(): Promise<void> {
  console.log(`\n${colors.bright}${colors.cyan}⚡ TEST DE PERFORMANCE MULTI-DEVISES${colors.reset}\n`);
  
  const iterations = 10000;
  console.log(`  Exécution de ${iterations} calculs EUR et USD...`);
  
  const start = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const amount = Math.random() * 100 + 5;
    const type = i % 2 === 0 ? 'lawyer' : 'expat';
    const currency = i % 2 === 0 ? 'eur' : 'usd';
    
    validateAmount(amount, type as 'lawyer' | 'expat', currency as 'eur' | 'usd');
    calculateSplit(amount, type as 'lawyer' | 'expat', currency as 'eur' | 'usd');
    toCents(amount, currency as 'eur' | 'usd');
    fromCents(Math.round(amount * 100), currency as 'eur' | 'usd');
  }
  
  const duration = Date.now() - start;
  const avgTime = duration / iterations;
  
  console.log(`\n  ${colors.green}✅ Performance multi-devises:${colors.reset}`);
  console.log(`     • Durée totale: ${duration}ms`);
  console.log(`     • Temps moyen par opération: ${avgTime.toFixed(4)}ms`);
  console.log(`     • Opérations par seconde: ${Math.round(1000 / avgTime)}`);
  
  if (avgTime > 1) {
    console.log(`\n  ${colors.yellow}⚠️ Performance dégradée (>1ms par opération)${colors.reset}`);
  } else {
    console.log(`\n  ${colors.green}✅ Performance optimale${colors.reset}`);
  }
}

/**
 * Fonction principale pour lancer tous les tests multi-devises
 */
export async function runAllProductionTests(): Promise<boolean> {
  console.log(`\n${colors.bright}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}🚀 SUITE COMPLÈTE DE TESTS DE PRODUCTION MULTI-DEVISES${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(70)}${colors.reset}`);
  
  // Tests critiques
  const criticalTestsPassed = await runCriticalTests();
  
  // Test de performance
  await runPerformanceTest();
  
  // Test d'intégration
  await runIntegrationTest();
  
  return criticalTestsPassed;
}
