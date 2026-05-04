const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function extract(src, name) {
  const re = new RegExp(name + '\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)');
  const m = src.match(re);
  if (!m) return new Set();
  // Accept both single-quoted ('US') and double-quoted ("US") codes.
  const codes = (m[1].match(/['"]([A-Z]{2})['"]/g) || []).map(s => s.replace(/['"]/g, ''));
  return new Set(codes);
}

const backend = fs.readFileSync(path.join(ROOT, 'firebase/functions/src/lib/paymentCountries.ts'), 'utf8');
const frontHook = fs.readFileSync(path.join(ROOT, 'src/hooks/usePaymentGateway.ts'), 'utf8');
const frontReg = fs.readFileSync(path.join(ROOT, 'src/components/registration/shared/stripeCountries.ts'), 'utf8');
const uiData = fs.readFileSync(path.join(ROOT, 'src/data/countries.ts'), 'utf8');

const beStripe = extract(backend, 'STRIPE_SUPPORTED_COUNTRIES');
const bePayPal = extract(backend, 'PAYPAL_ONLY_COUNTRIES');
const beFROverseas = extract(backend, 'FRENCH_OVERSEAS_EUR');
const beEmbargo = extract(backend, 'EMBARGOED_COUNTRIES');

const fhPayPal = extract(frontHook, 'PAYPAL_ONLY_COUNTRIES');
const fhFROverseas = extract(frontHook, 'FRENCH_OVERSEAS_EUR');
const fhEmbargo = extract(frontHook, 'EMBARGOED_COUNTRIES');

const frStripe = extract(frontReg, 'STRIPE_SUPPORTED_COUNTRIES');
const frFROverseas = extract(frontReg, 'FRENCH_OVERSEAS_EUR');

const uiCodes = new Set((uiData.match(/code:\s*['"]([A-Z]{2})['"]/g) || []).map(s => s.match(/['"]([A-Z]{2})['"]/)[1]));

function diff(a, b, labelA, labelB) {
  const onlyA = [...a].filter(x => !b.has(x));
  const onlyB = [...b].filter(x => !a.has(x));
  if (onlyA.length === 0 && onlyB.length === 0) return null;
  return `${labelA}-only=[${onlyA.join(',')}] ${labelB}-only=[${onlyB.join(',')}]`;
}

let errors = 0;
function check(label, ok, detail = '') {
  if (ok) console.log('  PASS ' + label + (detail ? ' ' + detail : ''));
  else { console.log('  FAIL ' + label + ' ' + detail); errors++; }
}

console.log('========== COHERENCE CHECK ==========\n');

console.log('Backend STRIPE:', beStripe.size, '| Frontend STRIPE:', frStripe.size);
const sd = diff(beStripe, frStripe, 'backend', 'frontend');
check('Stripe lists match', sd === null, sd || '');

console.log('\nBackend PAYPAL:', bePayPal.size, '| Frontend hook PAYPAL:', fhPayPal.size);
const pd = diff(bePayPal, fhPayPal, 'backend', 'frontend-hook');
check('PayPal lists match', pd === null, pd || '');

console.log('\nBackend FR_OVERSEAS:', beFROverseas.size, '| Frontend hook:', fhFROverseas.size, '| Frontend reg:', frFROverseas.size);
const fd1 = diff(beFROverseas, fhFROverseas, 'backend', 'fhook');
const fd2 = diff(beFROverseas, frFROverseas, 'backend', 'freg');
check('Backend <-> Frontend hook FR_OVERSEAS', fd1 === null, fd1 || '');
check('Backend <-> Frontend reg FR_OVERSEAS', fd2 === null, fd2 || '');

console.log('\nBackend EMBARGO:', beEmbargo.size, '| Frontend hook EMBARGO:', fhEmbargo.size);
const ed = diff(beEmbargo, fhEmbargo, 'backend', 'frontend-hook');
check('Embargo lists match', ed === null, ed || '');

console.log('\n========== OVERLAP CHECK ==========');
const stripPaypalOverlap = [...beStripe].filter(x => bePayPal.has(x));
check('No country in BOTH Stripe AND PayPal', stripPaypalOverlap.length === 0, stripPaypalOverlap.join(','));

const stripeEmbargoOverlap = [...beStripe].filter(x => beEmbargo.has(x));
const paypalEmbargoOverlap = [...bePayPal].filter(x => beEmbargo.has(x));
check('No embargo code in Stripe list', stripeEmbargoOverlap.length === 0, stripeEmbargoOverlap.join(','));
check('No embargo code in PayPal list', paypalEmbargoOverlap.length === 0, paypalEmbargoOverlap.join(','));

const frInStripe = [...beFROverseas].filter(x => beStripe.has(x));
const frInPaypal = [...beFROverseas].filter(x => bePayPal.has(x));
check('FR overseas not duplicated in Stripe (raw)', frInStripe.length === 0, frInStripe.join(','));
check('FR overseas not duplicated in PayPal', frInPaypal.length === 0, frInPaypal.join(','));

console.log('\n========== UI DROPDOWN CHECK ==========');
console.log('UI countries.ts: ' + uiCodes.size + ' entries');
const allCovered = [...beStripe, ...bePayPal, ...beFROverseas];
const missingFromUI = allCovered.filter(c => !uiCodes.has(c));
check('All covered codes present in UI dropdown', missingFromUI.length === 0, missingFromUI.join(','));

const embargoInUI = [...beEmbargo].filter(c => uiCodes.has(c));
console.log('  INFO: Embargo codes still listed in UI dropdown (blocked at validation): ' + embargoInUI.join(','));

console.log('\n========== TOTALS ==========');
console.log('  Stripe:', beStripe.size);
console.log('  PayPal:', bePayPal.size);
console.log('  FR overseas (->FR):', beFROverseas.size);
console.log('  Total accepted:', beStripe.size + bePayPal.size + beFROverseas.size);
console.log('  Embargo (rejected):', beEmbargo.size);

console.log('\n========== RESULT ==========');
console.log(errors === 0 ? '  ALL CHECKS PASSED' : '  ' + errors + ' CHECK(S) FAILED');
process.exit(errors === 0 ? 0 : 1);
