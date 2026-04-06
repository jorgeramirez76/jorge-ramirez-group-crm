/**
 * Brownbook.net Business Listing Submission
 * Dofollow backlink, DA 55
 */
const { chromium } = require('playwright');

const BIZ = {
  name: 'The Jorge Ramirez Group',
  phone: '9082307844',
  website: 'https://www.thejorgeramirezgroup.com',
  email: 'george@thejorgeramirezgroup.com',
  address: 'Summit',
  state: 'New Jersey',
  zip: '07901',
  country: 'United States',
  category: 'Real Estate',
  description: 'George Ramirez leads The Jorge Ramirez Group at Keller Williams Premier Properties, serving Central and Northern New Jersey with a specialty in luxury markets including Summit, Short Hills, and Chatham. With over 15 years of experience and more than 500 homes sold, George combines deep local market expertise with cutting-edge technology to deliver exceptional results for buyers and sellers.',
};

async function main() {
  const browser = await chromium.launch({ headless: false }); // Headed so we can see
  const page = await browser.newPage();

  console.log('[Brownbook] Navigating to add business page...');
  await page.goto('https://www.brownbook.net/add-business/');
  await page.waitForLoadState('networkidle');

  // Get all visible form fields
  const inputs = await page.$$eval('input:visible, textarea:visible, select:visible', els =>
    els.map(el => ({ tag: el.tagName, name: el.name, id: el.id, type: el.type, placeholder: el.placeholder }))
  );
  console.log('Found fields:', JSON.stringify(inputs, null, 2));

  // Try to fill fields by various selectors
  const fillAttempts = [
    { selectors: ['input[name*="name" i]', 'input[placeholder*="name" i]', '#business_name', '#name'], value: BIZ.name },
    { selectors: ['input[name*="phone" i]', 'input[placeholder*="phone" i]', '#phone'], value: BIZ.phone },
    { selectors: ['input[name*="website" i]', 'input[name*="url" i]', 'input[placeholder*="website" i]', '#website'], value: BIZ.website },
    { selectors: ['input[name*="email" i]', 'input[placeholder*="email" i]', '#email'], value: BIZ.email },
    { selectors: ['input[name*="city" i]', 'input[name*="address" i]', 'input[placeholder*="city" i]', '#city'], value: BIZ.address },
    { selectors: ['input[name*="zip" i]', 'input[name*="postal" i]', '#zip'], value: BIZ.zip },
    { selectors: ['textarea[name*="desc" i]', 'textarea[name*="about" i]', '#description', 'textarea'], value: BIZ.description },
  ];

  for (const attempt of fillAttempts) {
    for (const selector of attempt.selectors) {
      try {
        const el = await page.$(selector);
        if (el && await el.isVisible()) {
          await el.fill(attempt.value);
          console.log(`  Filled: ${selector} = ${attempt.value.substring(0, 30)}...`);
          break;
        }
      } catch {}
    }
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/brownbook_filled.png' });
  console.log('[Brownbook] Screenshot saved to /tmp/brownbook_filled.png');

  // Look for submit button
  const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add")');
  if (submitBtn) {
    console.log('[Brownbook] Found submit button — clicking...');
    await submitBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: '/tmp/brownbook_submitted.png' });
    console.log('[Brownbook] Submitted! Screenshot at /tmp/brownbook_submitted.png');
  } else {
    console.log('[Brownbook] No submit button found — check screenshot');
  }

  // Keep browser open for 5 seconds to see result
  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
