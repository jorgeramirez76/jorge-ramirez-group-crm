/**
 * Brownbook.net — Slow, human-like submission
 * This is the highest priority dofollow backlink (DA 55)
 */
const { chromium } = require('playwright');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.5));
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  console.log('[1/10] Loading Brownbook...');
  await page.goto('https://www.brownbook.net/add-business/');
  await page.waitForLoadState('networkidle');
  await sleep(3000);

  // Business name
  console.log('[2/10] Typing business name...');
  await page.click('input[name="name"]');
  await sleep(800);
  await page.type('input[name="name"]', 'The Jorge Ramirez Group', { delay: 75 });
  await sleep(2000);

  // Category — this is a React Select, need to click then type
  console.log('[3/10] Selecting category...');
  try {
    // Click the select area
    const catArea = await page.$('div:has(> input[placeholder="Select category"])');
    if (catArea) {
      await catArea.click();
    } else {
      await page.click('input[placeholder="Select category"]', { force: true });
    }
    await sleep(1000);
    await page.keyboard.type('Real', { delay: 120 });
    await sleep(2000);
    // Try pressing down arrow and enter to select
    await page.keyboard.press('ArrowDown');
    await sleep(500);
    await page.keyboard.press('Enter');
    console.log('  Category selected');
  } catch (e) {
    console.log('  Category failed: ' + e.message.substring(0, 50));
  }
  // Close any popup/dropdown overlay
  await page.keyboard.press('Escape');
  await sleep(1000);
  await page.keyboard.press('Escape');
  await sleep(1500);
  // Click somewhere neutral to dismiss
  await page.mouse.click(10, 10);
  await sleep(2000);

  // Address
  console.log('[4/10] Typing address...');
  await page.click('textarea[name="address"]');
  await sleep(600);
  await page.type('textarea[name="address"]', '488 Springfield Avenue, Summit, NJ 07901', { delay: 65 });
  await sleep(2000);

  // City
  console.log('[5/10] Typing city...');
  await page.click('input[name="city"]');
  await sleep(500);
  await page.type('input[name="city"]', 'Summit', { delay: 85 });
  await sleep(1500);

  // Country
  console.log('[6/10] Selecting country...');
  try {
    const countryArea = await page.$('div:has(> #react-select-country_select-input)');
    if (countryArea) {
      await countryArea.click();
    } else {
      await page.click('#react-select-country_select-input', { force: true });
    }
    await sleep(1000);
    await page.keyboard.type('United', { delay: 100 });
    await sleep(2000);
    await page.keyboard.press('ArrowDown');
    await sleep(500);
    await page.keyboard.press('Enter');
    console.log('  Country selected');
  } catch (e) {
    console.log('  Country failed: ' + e.message.substring(0, 50));
  }
  // Dismiss country dropdown
  await page.keyboard.press('Escape');
  await sleep(800);
  await page.keyboard.press('Escape');
  await sleep(500);
  await page.mouse.click(10, 10);
  await sleep(2000);

  // Scroll down naturally
  await page.mouse.wheel(0, 400);
  await sleep(1500);

  // Zip
  console.log('[7/10] Typing zip...');
  await page.click('input[name="zip_code"]');
  await sleep(500);
  await page.type('input[name="zip_code"]', '07901', { delay: 95 });
  await sleep(1500);

  // Phone
  console.log('[8/10] Typing phone...');
  await page.click('input[name="phone"]');
  await sleep(500);
  await page.type('input[name="phone"]', '(908) 230-7844', { delay: 80 });
  await sleep(1500);

  // Email
  await page.click('input[name="email"]');
  await sleep(500);
  await page.type('input[name="email"]', 'jorgeramirez76@icloud.com', { delay: 55 });
  await sleep(1500);

  // Scroll down more
  await page.mouse.wheel(0, 400);
  await sleep(1500);

  // Website (main backlink!)
  console.log('[9/10] Typing website...');
  await page.click('input[name="website"]');
  await sleep(500);
  await page.type('input[name="website"]', 'https://www.thejorgeramirezgroup.com', { delay: 50 });
  await sleep(1500);

  // Display website (2nd backlink!)
  await page.click('input[name="display_website"]');
  await sleep(500);
  await page.type('input[name="display_website"]', 'https://www.aisalespipeline.com', { delay: 50 });
  await sleep(2000);

  // Screenshot before submit
  await page.screenshot({ path: '/tmp/slow_brownbook_filled.png', fullPage: true });

  // Submit
  console.log('[10/10] Submitting...');
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await sleep(2000);
    await submitBtn.click();
    await sleep(8000);
    await page.screenshot({ path: '/tmp/slow_brownbook_result.png', fullPage: true });
    const url = page.url();
    console.log('  Result URL: ' + url);

    if (url.includes('brownbook.net') && !url.includes('add-business')) {
      console.log('  ✓ SUCCESS — Listing submitted!');
    } else {
      console.log('  ⚠ May need manual completion — check screenshot');
    }
  }

  await browser.close();
}

main().catch(e => console.log('Error: ' + e.message));
