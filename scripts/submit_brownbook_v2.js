const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('[Brownbook] Navigating...');
  await page.goto('https://www.brownbook.net/add-business/');
  await page.waitForLoadState('networkidle');

  // Business name
  await page.fill('input[name="name"]', 'The Jorge Ramirez Group');
  console.log('  ✓ Name');

  // Category — click and type to search
  await page.click('input[placeholder="Select category"]');
  await page.fill('input[placeholder="Select category"]', 'Real Estate');
  await page.waitForTimeout(1000);
  // Click the first result
  const catOption = await page.$('div[class*="option"], li[class*="option"], [role="option"]');
  if (catOption) {
    await catOption.click();
    console.log('  ✓ Category');
  }

  // Address (short, not the bio)
  await page.fill('textarea[name="address"]', 'Summit, NJ 07901');
  console.log('  ✓ Address');

  // City
  await page.fill('input[name="city"]', 'Summit');
  console.log('  ✓ City');

  // Country — select United States
  await page.click('#react-select-country_select-input');
  await page.fill('#react-select-country_select-input', 'United States');
  await page.waitForTimeout(1000);
  const countryOption = await page.$('div[class*="option"]:has-text("United States")');
  if (countryOption) {
    await countryOption.click();
    console.log('  ✓ Country');
  }

  await page.waitForTimeout(500);

  // Zip
  await page.fill('input[name="zip_code"]', '07901');
  console.log('  ✓ Zip');

  // Phone
  await page.fill('input[name="phone"]', '(908) 230-7844');
  console.log('  ✓ Phone');

  // Email
  await page.fill('input[name="email"]', 'george@thejorgeramirezgroup.com');
  console.log('  ✓ Email');

  // Website
  await page.fill('input[name="website"]', 'https://www.thejorgeramirezgroup.com');
  console.log('  ✓ Website');

  // Display website
  await page.fill('input[name="display_website"]', 'https://www.aisalespipeline.com');
  console.log('  ✓ Display Website (2nd backlink)');

  // Social media
  await page.fill('input[name="facebook"]', 'https://www.facebook.com/jorgeramirezgroup').catch(() => {});
  await page.fill('input[name="instagram"]', 'https://www.instagram.com/jorgeramirezgroup').catch(() => {});
  await page.fill('input[name="linkedin"]', 'https://www.linkedin.com/in/jorgeramirez').catch(() => {});
  console.log('  ✓ Social links');

  await page.screenshot({ path: '/tmp/brownbook_v2_filled.png', fullPage: true });
  console.log('  Screenshot: /tmp/brownbook_v2_filled.png');

  // Submit
  const submitBtn = await page.$('button[type="submit"], button:has-text("Submit"), button:has-text("Add")');
  if (submitBtn) {
    await submitBtn.click();
    console.log('  Submitting...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/brownbook_v2_result.png', fullPage: true });
    console.log('  Result: /tmp/brownbook_v2_result.png');
    console.log('  ✓ SUBMITTED');
  }

  await page.waitForTimeout(3000);
  await browser.close();
}

main().catch(console.error);
