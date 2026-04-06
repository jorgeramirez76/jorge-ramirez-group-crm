/**
 * Backlink Pre-Fill Scripts
 * Opens each site, fills all forms, waits for you to click CAPTCHA + submit.
 * Run: node scripts/backlink_prefill_all.js [site]
 * Sites: merchantcircle, alignable, hotfrog, brownbook, yelp, bbb
 * Or: node scripts/backlink_prefill_all.js all
 */

const { chromium } = require('playwright');

const EMAIL = 'jorgeramirez76@icloud.com';
const PWD = 'JRG2026BacklinkPwd!';
const BIZ = {
  name: 'The Jorge Ramirez Group',
  first: 'Jorge',
  last: 'Ramirez',
  phone: '(908) 230-7844',
  phoneRaw: '9082307844',
  website: 'https://www.thejorgeramirezgroup.com',
  website2: 'https://www.aisalespipeline.com',
  city: 'Summit',
  state: 'NJ',
  zip: '07901',
  address: '85 Summit Ave',
  category: 'Real Estate',
  bio: 'The Jorge Ramirez Group at Keller Williams Premier Properties serves Central and Northern New Jersey specializing in luxury real estate. Over 15 years experience, 500+ homes sold in Summit, Short Hills, Chatham and surrounding communities.',
};

async function fillInputs(page, mappings) {
  const inputs = await page.$$('input:visible, textarea:visible');
  for (const input of inputs) {
    const type = (await input.getAttribute('type') || 'text').toLowerCase();
    if (['radio', 'checkbox', 'hidden', 'submit', 'button', 'file'].includes(type)) continue;

    const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
    const nm = (await input.getAttribute('name') || '').toLowerCase();
    const id = (await input.getAttribute('id') || '').toLowerCase();
    const all = ph + ' ' + nm + ' ' + id;

    for (const [keywords, value] of mappings) {
      if (keywords.some(k => all.includes(k))) {
        try { await input.fill(value); } catch {}
        break;
      }
    }
  }
}

const SITES = {
  async merchantcircle(browser) {
    console.log('\n=== MerchantCircle (DA 56) ===');
    const page = await browser.newPage();
    await page.goto('https://www.merchantcircle.com/signup');
    await page.waitForLoadState('networkidle');

    await fillInputs(page, [
      [['first'], BIZ.first],
      [['last'], BIZ.last],
      [['email'], EMAIL],
      [['password', 'confirm'], PWD],
      [['zip', 'postal'], BIZ.zip],
      [['business', 'company'], BIZ.name],
      [['phone'], BIZ.phoneRaw],
    ]);

    try { await page.click('label:has-text("business owner")', { timeout: 2000 }); } catch {}
    console.log('  Form filled. Click the CAPTCHA and "Create my account".');
    console.log('  Waiting 120 seconds for you...');
    await page.waitForURL('**/dashboard**', { timeout: 120000 }).catch(() => {});
    console.log('  URL: ' + page.url());
    await page.screenshot({ path: '/tmp/bl_merchantcircle.png' });
    return page;
  },

  async alignable(browser) {
    console.log('\n=== Alignable (DA 60, dofollow) ===');
    const page = await browser.newPage();
    await page.goto('https://www.alignable.com/register');
    await page.waitForLoadState('networkidle');

    await fillInputs(page, [
      [['first'], BIZ.first],
      [['last'], BIZ.last],
      [['email'], EMAIL],
      [['password'], PWD],
      [['business', 'company'], BIZ.name],
      [['zip', 'postal'], BIZ.zip],
      [['phone'], BIZ.phone],
    ]);

    console.log('  Form filled. Complete CAPTCHA if present and submit.');
    console.log('  Waiting 120 seconds...');
    await page.waitForTimeout(120000);
    await page.screenshot({ path: '/tmp/bl_alignable.png' });
    return page;
  },

  async yelp(browser) {
    console.log('\n=== Yelp (DA 94) ===');
    const page = await browser.newPage();
    await page.goto('https://biz.yelp.com/signup_business/new');
    await page.waitForLoadState('networkidle');

    await fillInputs(page, [
      [['first'], BIZ.first],
      [['last'], BIZ.last],
      [['email'], EMAIL],
      [['password'], PWD],
      [['business', 'company'], BIZ.name],
      [['zip', 'postal'], BIZ.zip],
      [['phone'], BIZ.phone],
      [['address', 'street'], BIZ.address],
      [['city'], BIZ.city],
      [['website', 'url'], BIZ.website],
    ]);

    console.log('  Form filled. Complete any verification and submit.');
    console.log('  Waiting 120 seconds...');
    await page.waitForTimeout(120000);
    await page.screenshot({ path: '/tmp/bl_yelp.png' });
    return page;
  },

  async brownbook(browser) {
    console.log('\n=== Brownbook (DA 55, dofollow) ===');
    const page = await browser.newPage();
    await page.goto('https://www.brownbook.net/add-business/');
    await page.waitForLoadState('networkidle');

    // Fill standard inputs
    await page.fill('input[name="name"]', BIZ.name).catch(() => {});
    await page.fill('textarea[name="address"]', BIZ.address + ', ' + BIZ.city + ', ' + BIZ.state + ' ' + BIZ.zip).catch(() => {});
    await page.fill('input[name="city"]', BIZ.city).catch(() => {});
    await page.fill('input[name="zip_code"]', BIZ.zip).catch(() => {});
    await page.fill('input[name="phone"]', BIZ.phone).catch(() => {});
    await page.fill('input[name="email"]', EMAIL).catch(() => {});
    await page.fill('input[name="website"]', BIZ.website).catch(() => {});
    await page.fill('input[name="display_website"]', BIZ.website2).catch(() => {});

    // Category and Country dropdowns need clicking
    console.log('  Form filled. Select category "Real Estate" and country "United States" from dropdowns, then submit.');
    console.log('  Waiting 120 seconds...');
    await page.waitForTimeout(120000);
    await page.screenshot({ path: '/tmp/bl_brownbook.png' });
    return page;
  },

  async crunchbase(browser) {
    console.log('\n=== Crunchbase (DA 91, dofollow) — for aisalespipeline.com ===');
    const page = await browser.newPage();
    await page.goto('https://www.crunchbase.com/register');
    await page.waitForLoadState('networkidle');

    await fillInputs(page, [
      [['first'], BIZ.first],
      [['last'], BIZ.last],
      [['email'], EMAIL],
      [['password'], PWD],
    ]);

    console.log('  Form filled. Complete signup, then add AI Sales Pipeline as a company.');
    console.log('  Waiting 120 seconds...');
    await page.waitForTimeout(120000);
    await page.screenshot({ path: '/tmp/bl_crunchbase.png' });
    return page;
  },

  async producthunt(browser) {
    console.log('\n=== Product Hunt (DA 90, dofollow) — for aisalespipeline.com ===');
    const page = await browser.newPage();
    await page.goto('https://www.producthunt.com/');
    await page.waitForLoadState('networkidle');

    console.log('  Product Hunt loaded. Sign up and submit aisalespipeline.com as a new product.');
    console.log('  Tagline: "The AI sales assistant that books appointments while you sleep"');
    console.log('  Waiting 120 seconds...');
    await page.waitForTimeout(120000);
    await page.screenshot({ path: '/tmp/bl_producthunt.png' });
    return page;
  },
};

async function main() {
  const target = process.argv[2] || 'all';
  const browser = await chromium.launch({ headless: false });

  if (target === 'all') {
    for (const [name, fn] of Object.entries(SITES)) {
      try { await fn(browser); } catch (e) { console.log(`  ${name} error: ${e.message.substring(0, 80)}`); }
    }
  } else if (SITES[target]) {
    await SITES[target](browser);
  } else {
    console.log('Unknown site. Available: ' + Object.keys(SITES).join(', '));
  }

  await browser.close();
  console.log('\nAll done!');
}

main().catch(console.error);
