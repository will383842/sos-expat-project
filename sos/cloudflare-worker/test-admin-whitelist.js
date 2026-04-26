// Test the modified isBlogProxyPath /admin whitelist logic
// Replicates the relevant portion of worker.js to verify routing.

function isAdminProxiedToBlog(path) {
  // Mirrors the new whitelist in worker.js
  return (
    path === '/admin/login' ||
    path === '/admin/logout' ||
    path.startsWith('/admin/articles') ||
    path.startsWith('/admin/affiliate-links') ||
    path.startsWith('/admin/external-links') ||
    path.startsWith('/admin/redirects') ||
    path.startsWith('/admin/fiches') ||
    path.startsWith('/admin/tools') ||
    path.startsWith('/admin/image-bank')
  );
}

const cases = [
  // Should go to LARAVEL (blog)
  { path: '/admin/login',                    expected: true,  label: 'Laravel: admin login' },
  { path: '/admin/logout',                   expected: true,  label: 'Laravel: admin logout' },
  { path: '/admin/articles',                 expected: true,  label: 'Laravel: articles index' },
  { path: '/admin/articles/123',             expected: true,  label: 'Laravel: article detail' },
  { path: '/admin/articles/123/edit',        expected: true,  label: 'Laravel: article edit' },
  { path: '/admin/articles/123/preview',     expected: true,  label: 'Laravel: article preview' },
  { path: '/admin/affiliate-links',          expected: true,  label: 'Laravel: affiliate-links' },
  { path: '/admin/affiliate-links/create',   expected: true,  label: 'Laravel: affiliate-links create' },
  { path: '/admin/external-links',           expected: true,  label: 'Laravel: external-links' },
  { path: '/admin/redirects',                expected: true,  label: 'Laravel: redirects' },
  { path: '/admin/redirects/9/edit',         expected: true,  label: 'Laravel: redirect edit' },
  { path: '/admin/fiches',                   expected: true,  label: 'Laravel: fiches' },
  { path: '/admin/fiches/expatriation',      expected: true,  label: 'Laravel: fiches type' },
  { path: '/admin/fiches/vacances/generate', expected: true,  label: 'Laravel: fiches generate' },
  { path: '/admin/tools',                    expected: true,  label: 'Laravel: tools' },
  { path: '/admin/tools/leads',              expected: true,  label: 'Laravel: tools leads' },
  { path: '/admin/tools/leads/export',       expected: true,  label: 'Laravel: tools export' },
  { path: '/admin/image-bank',               expected: true,  label: 'Laravel: image-bank' },
  { path: '/admin/image-bank/categories',    expected: true,  label: 'Laravel: image-bank categories' },

  // Should go to PAGES (React) - currently broken before fix
  { path: '/admin',                          expected: false, label: 'React: /admin (will redirect to /admin/dashboard)' },
  { path: '/admin/',                         expected: false, label: 'React: /admin/' },
  { path: '/admin/dashboard',                expected: false, label: 'React: dashboard' },
  { path: '/admin/aaaprofiles',              expected: false, label: 'React: aaaprofiles' },
  { path: '/admin/aaaprofiles/',             expected: false, label: 'React: aaaprofiles trailing slash' },
  { path: '/admin/users/all',                expected: false, label: 'React: users/all' },
  { path: '/admin/users/clients',            expected: false, label: 'React: users/clients' },
  { path: '/admin/users/providers/lawyers',  expected: false, label: 'React: lawyers list' },
  { path: '/admin/finance/dashboard',        expected: false, label: 'React: finance dashboard' },
  { path: '/admin/finance/transactions',     expected: false, label: 'React: finance transactions' },
  { path: '/admin/comms/campaigns',          expected: false, label: 'React: comms campaigns' },
  { path: '/admin/partners-b2b',             expected: false, label: 'React: partners-b2b' },
  { path: '/admin/chatters',                 expected: false, label: 'React: chatters' },
  { path: '/admin/chatters/captains',        expected: false, label: 'React: chatters/captains' },
  { path: '/admin/influencers',              expected: false, label: 'React: influencers' },
  { path: '/admin/bloggers/articles',        expected: false, label: 'React: bloggers/articles (NOT Laravel /admin/articles!)' },
  { path: '/admin/group-admins',             expected: false, label: 'React: group-admins' },
  { path: '/admin/marketing/whatsapp-groups',expected: false, label: 'React: marketing whatsapp' },
  { path: '/admin/payments',                 expected: false, label: 'React: payments' },
  { path: '/admin/toolbox',                  expected: false, label: 'React: toolbox' },
  { path: '/admin/toolbox/telegram/dashboard', expected: false, label: 'React: telegram dashboard' },
  { path: '/admin/pricing',                  expected: false, label: 'React: pricing' },
  { path: '/admin/coupons',                  expected: false, label: 'React: coupons' },
  { path: '/admin/countries',                expected: false, label: 'React: countries' },
  { path: '/admin/cms/faqs',                 expected: false, label: 'React: cms faqs' },
  { path: '/admin/backups',                  expected: false, label: 'React: backups' },
  { path: '/admin/system-health',            expected: false, label: 'React: system-health' },
  { path: '/admin/settings',                 expected: false, label: 'React: settings' },
  { path: '/admin/ia',                       expected: false, label: 'React: ia' },
  { path: '/admin/analytics/unified',        expected: false, label: 'React: analytics unified' },
  { path: '/admin/reports/financial',        expected: false, label: 'React: reports financial' },
  { path: '/admin/security/alerts',          expected: false, label: 'React: security alerts' },
  { path: '/admin/press/releases',           expected: false, label: 'React: press releases' },
  { path: '/admin/subscription-plans',       expected: false, label: 'React: subscription-plans' },
  { path: '/admin/training',                 expected: false, label: 'React: training' },
  { path: '/admin/commissions',              expected: false, label: 'React: commissions' },
  { path: '/admin/affiliates',               expected: false, label: 'React: affiliates' },

  // Edge cases — names that LOOK like Laravel but are actually React subroutes
  { path: '/admin/bloggers/articles/12',     expected: false, label: 'React: bloggers/articles/:id (NOT Laravel)' },

  // Trailing slash on Laravel routes
  { path: '/admin/articles/',                expected: true,  label: 'Laravel: articles trailing slash' },
];

let failures = 0;
let passes = 0;
for (const { path, expected, label } of cases) {
  const actual = isAdminProxiedToBlog(path);
  const ok = actual === expected;
  if (ok) {
    passes++;
    console.log(`PASS ${label}  →  ${path}  →  ${actual ? 'Laravel' : 'Pages'}`);
  } else {
    failures++;
    console.log(`FAIL ${label}  →  ${path}  →  expected=${expected ? 'Laravel' : 'Pages'} actual=${actual ? 'Laravel' : 'Pages'}`);
  }
}
console.log(`\n=== ${passes} passes, ${failures} failures ===`);
process.exit(failures > 0 ? 1 : 0);
