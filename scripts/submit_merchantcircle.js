const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.merchantcircle.com/signup', { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  // Fill all fields
  const fields = await page.$$('input:visible');
  for (const field of fields) {
    const placeholder = await field.getAttribute('placeholder') || '';
    const name = await field.getAttribute('name') || '';
    const type = await field.getAttribute('type') || '';

    if (placeholder.includes('First') || name.includes('first')) {
      await field.fill('Jorge');
      console.log('  Filled: First Name');
    } else if (placeholder.includes('Last') || name.includes('last')) {
      await field.fill('Ramirez');
      console.log('  Filled: Last Name');
    } else if (type === 'email' || name.includes('email')) {
      await field.fill('george@thejorgeramirezgroup.com');
      console.log('  Filled: Email');
    } else if (type === 'password') {
      await field.fill('JRG2026SecurePwd!');
      console.log('  Filled: Password field');
    } else if (placeholder.includes('Zip') || name.includes('zip')) {
      await field.fill('07901');
      console.log('  Filled: Zip');
    } else if (placeholder.includes('Business') || name.includes('business')) {
      await field.fill('The Jorge Ramirez Group');
      console.log('  Filled: Business Name');
    } else if (placeholder.includes('Phone') || name.includes('phone')) {
      await field.fill('9082307844');
      console.log('  Filled: Phone');
    }
  }

  // Select "business owner" if available
  const labels = await page.$$('label');
  for (const label of labels) {
    const text = await label.textContent();
    if (text && text.toLowerCase().includes('business owner')) {
      await label.click();
      console.log('  Selected: Business owner');
      break;
    }
  }

  await page.screenshot({ path: '/tmp/merchantcircle_filled.png', fullPage: true });
  console.log('  Screenshot: /tmp/merchantcircle_filled.png');

  // Click submit
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && text.toLowerCase().includes('create')) {
      console.log('  Clicking: Create my account...');
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/tmp/merchantcircle_result.png', fullPage: true });
  console.log('  Result URL: ' + page.url());
  console.log('  Result screenshot: /tmp/merchantcircle_result.png');

  await browser.close();
}

main().catch(e => console.log('Error: ' + e.message));
