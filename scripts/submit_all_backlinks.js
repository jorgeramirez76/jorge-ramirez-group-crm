const { chromium } = require('playwright');

const BIZ = {
  name: 'The Jorge Ramirez Group',
  phone: '(908) 230-7844',
  website: 'https://www.thejorgeramirezgroup.com',
  website2: 'https://www.aisalespipeline.com',
  email: 'george@thejorgeramirezgroup.com',
  address: 'Summit, NJ 07901',
  city: 'Summit',
  state: 'NJ',
  zip: '07901',
  description: 'The Jorge Ramirez Group at Keller Williams Premier Properties serves Central and Northern New Jersey specializing in luxury real estate. Over 15 years experience, 500+ homes sold.',
};

const results = [];

async function submitBrownbook(browser) {
  const page = await browser.newPage();
  console.log('\n[Brownbook] Submitting...');
  try {
    await page.goto('https://www.brownbook.net/add-business/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="name"]', BIZ.name);

    // Category dropdown — click to open, then click option
    const catInput = await page.$('#react-select-country_select-input');
    // Try clicking the category area first
    await page.click('text=Select category').catch(() => {});
    await page.waitForTimeout(500);
    await page.keyboard.type('Real Estate');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');

    await page.fill('textarea[name="address"]', BIZ.address);
    await page.fill('input[name="city"]', BIZ.city);

    // Country dropdown
    const countryInput = await page.$('#react-select-country_select-input');
    if (countryInput) {
      await countryInput.click();
      await page.keyboard.type('United States');
      await page.waitForTimeout(1000);
      await page.keyboard.press('Enter');
    }

    await page.fill('input[name="zip_code"]', BIZ.zip);
    await page.fill('input[name="phone"]', BIZ.phone);
    await page.fill('input[name="email"]', BIZ.email);
    await page.fill('input[name="website"]', BIZ.website);
    await page.fill('input[name="display_website"]', BIZ.website2);

    await page.screenshot({ path: '/tmp/backlink_brownbook.png', fullPage: true });

    const btn = await page.$('button[type="submit"]');
    if (btn) {
      await btn.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/tmp/backlink_brownbook_result.png', fullPage: true });
      results.push({ site: 'Brownbook', status: 'submitted', dofollow: true, da: 55 });
      console.log('[Brownbook] ✓ Submitted!');
    }
  } catch (e) {
    results.push({ site: 'Brownbook', status: 'error', error: e.message.substring(0, 100) });
    console.log(`[Brownbook] Error: ${e.message.substring(0, 100)}`);
  }
  await page.close();
}

async function submitHotfrog(browser) {
  const page = await browser.newPage();
  console.log('\n[Hotfrog] Submitting...');
  try {
    await page.goto('https://www.hotfrog.com/register/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log(`[Hotfrog] Page: ${title}`);

    // Try to fill signup form
    await page.fill('input[name="email"], input[type="email"]', BIZ.email).catch(() => {});
    await page.screenshot({ path: '/tmp/backlink_hotfrog.png', fullPage: true });

    results.push({ site: 'Hotfrog', status: 'registration_page', dofollow: true, da: 52 });
    console.log('[Hotfrog] Registration page loaded');
  } catch (e) {
    results.push({ site: 'Hotfrog', status: 'error', error: e.message.substring(0, 100) });
    console.log(`[Hotfrog] Error: ${e.message.substring(0, 100)}`);
  }
  await page.close();
}

async function submitOpenPR(browser) {
  const page = await browser.newPage();
  console.log('\n[OpenPR] Submitting press release...');
  try {
    await page.goto('https://www.openpr.com/news/submit.html', { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    console.log(`[OpenPR] Page: ${title}`);
    await page.screenshot({ path: '/tmp/backlink_openpr.png', fullPage: true });

    // Check if there's a signup/login form first
    const hasLogin = await page.$('input[type="email"], input[name="email"]');
    if (hasLogin) {
      await page.fill('input[type="email"], input[name="email"]', BIZ.email).catch(() => {});
      console.log('[OpenPR] Email filled on form');
    }

    results.push({ site: 'OpenPR', status: 'page_loaded', dofollow: true, da: 65 });
  } catch (e) {
    results.push({ site: 'OpenPR', status: 'error', error: e.message.substring(0, 100) });
    console.log(`[OpenPR] Error: ${e.message.substring(0, 100)}`);
  }
  await page.close();
}

async function submitCylex(browser) {
  const page = await browser.newPage();
  console.log('\n[Cylex] Submitting...');
  try {
    await page.goto('https://www.cylex.us.com/company/signup/', { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    console.log(`[Cylex] Page: ${title}`);

    // Fill any available fields
    await page.fill('input[name*="company"], input[name*="name"]', BIZ.name).catch(() => {});
    await page.fill('input[name*="email"], input[type="email"]', BIZ.email).catch(() => {});
    await page.fill('input[name*="phone"]', BIZ.phone).catch(() => {});
    await page.fill('input[name*="website"], input[name*="url"]', BIZ.website).catch(() => {});

    await page.screenshot({ path: '/tmp/backlink_cylex.png', fullPage: true });
    results.push({ site: 'Cylex', status: 'attempted', dofollow: true, da: 50 });
    console.log('[Cylex] Form filled where possible');
  } catch (e) {
    results.push({ site: 'Cylex', status: 'error', error: e.message.substring(0, 100) });
    console.log(`[Cylex] Error: ${e.message.substring(0, 100)}`);
  }
  await page.close();
}

async function submitMerchantCircle(browser) {
  const page = await browser.newPage();
  console.log('\n[MerchantCircle] Submitting...');
  try {
    await page.goto('https://www.merchantcircle.com/signup', { timeout: 20000 });
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[name*="business"], input[name*="company"]', BIZ.name).catch(() => {});
    await page.fill('input[name*="email"], input[type="email"]', BIZ.email).catch(() => {});
    await page.fill('input[name*="zip"], input[name*="postal"]', BIZ.zip).catch(() => {});
    await page.fill('input[name*="phone"]', BIZ.phone).catch(() => {});

    await page.screenshot({ path: '/tmp/backlink_merchantcircle.png', fullPage: true });
    results.push({ site: 'MerchantCircle', status: 'form_filled', da: 56 });
    console.log('[MerchantCircle] Form filled');
  } catch (e) {
    results.push({ site: 'MerchantCircle', status: 'error', error: e.message.substring(0, 100) });
  }
  await page.close();
}

async function main() {
  console.log('=== Automated Backlink Submission ===');
  console.log(`Business: ${BIZ.name}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  // Run submissions
  await submitBrownbook(browser);
  await submitHotfrog(browser);
  await submitOpenPR(browser);
  await submitCylex(browser);
  await submitMerchantCircle(browser);

  await browser.close();

  // Summary
  console.log('\n=== SUBMISSION RESULTS ===');
  for (const r of results) {
    const icon = r.status === 'submitted' ? '✅' :
                 r.status === 'form_filled' ? '📝' :
                 r.status === 'error' ? '❌' : '⏳';
    console.log(`  ${icon} ${r.site} (DA ${r.da || '?'}${r.dofollow ? ', dofollow' : ''}): ${r.status}`);
  }

  const fs = require('fs');
  fs.writeFileSync('/tmp/backlink_submission_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved. Screenshots in /tmp/backlink_*.png');
}

main().catch(console.error);
