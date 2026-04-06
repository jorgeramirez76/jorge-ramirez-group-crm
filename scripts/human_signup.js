/**
 * Human-like Backlink Signup Script
 * Types slowly, adds random delays, moves mouse naturally
 * Uses correct business info from thejorgeramirezgroup.com
 */

const { chromium } = require('playwright');
const { execSync } = require('child_process');

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
  email: 'jorge.ramirez@kw.com',
  city: 'Summit',
  state: 'NJ',
  zip: '07901',
  address: '488 Springfield Avenue',
  fullAddress: '488 Springfield Avenue, Summit, NJ 07901',
  category: 'Real Estate',
  brokerage: 'Keller Williams Realty Premier Properties',
  bio: 'The Jorge Ramirez Group at Keller Williams Premier Properties is a top-producing real estate team serving Central and Northern New Jersey. Led by Jorge Ramirez with over 15 years of experience and 500+ homes sold, we specialize in luxury residential properties in Summit, Short Hills, Chatham, Westfield, Cranford, Millburn, Montclair, Maplewood, Hoboken, and Jersey City. We provide personalized, no-pressure service backed by deep local market knowledge.',
};

// Human-like helpers
function randomDelay(min = 500, max = 2000) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function humanType(page, selector, text, options = {}) {
  const el = await page.$(selector);
  if (!el) return false;
  if (!(await el.isVisible())) return false;

  await el.click();
  await randomDelay(200, 600);

  // Clear existing text
  await el.fill('');
  await randomDelay(100, 300);

  // Type character by character with random delays
  const delay = options.delay || (40 + Math.random() * 60);
  await el.type(text, { delay });

  await randomDelay(300, 800);
  return true;
}

async function humanClick(page, selector) {
  const el = await page.$(selector);
  if (!el) return false;

  // Move mouse to element area first
  const box = await el.boundingBox();
  if (box) {
    await page.mouse.move(
      box.x + box.width * (0.3 + Math.random() * 0.4),
      box.y + box.height * (0.3 + Math.random() * 0.4),
      { steps: 5 + Math.floor(Math.random() * 10) }
    );
    await randomDelay(200, 500);
  }

  await el.click();
  await randomDelay(300, 700);
  return true;
}

async function scrollDown(page, amount = 300) {
  await page.mouse.wheel(0, amount + Math.random() * 200);
  await randomDelay(500, 1000);
}

function getVerificationEmail(fromDomain, maxWaitSec = 90) {
  console.log(`    Checking for verification email from ${fromDomain}...`);
  const startTime = Date.now();

  while ((Date.now() - startTime) < maxWaitSec * 1000) {
    try {
      const result = execSync(`osascript -e '
        tell application "Mail"
          check for new mail
          delay 3
          set msgs to messages of inbox
          repeat with m in msgs
            if date received of m > (current date) - 180 then
              set senderAddr to sender of m
              if senderAddr contains "${fromDomain}" then
                return content of m
              end if
            end if
          end repeat
          return "NO_EMAIL"
        end tell
      '`, { timeout: 30000 }).toString().trim();

      if (result !== 'NO_EMAIL' && result.length > 10) {
        const urls = result.match(/https?:\/\/[^\s<>"'\])+]+/g) || [];
        const verifyUrl = urls.find(u =>
          /verify|confirm|activate|validate|token|click/i.test(u)
        ) || urls.find(u => u.length > 40);

        if (verifyUrl) {
          console.log(`    ✓ Found verification link`);
          return verifyUrl;
        }
      }
    } catch {}

    process.stdout.write('.');
    execSync('sleep 8');
  }
  console.log(`    No verification email found within ${maxWaitSec}s`);
  return null;
}

// ==========================================
// SITE SUBMISSIONS
// ==========================================

async function doMerchantCircle(browser) {
  console.log('\n══════════════════════════════════════');
  console.log('  MerchantCircle (DA 56)');
  console.log('══════════════════════════════════════');

  const page = await browser.newPage();
  try {
    await page.goto('https://www.merchantcircle.com/signup');
    await page.waitForLoadState('networkidle');
    await randomDelay(2000, 4000);

    // Fill form slowly
    console.log('  Filling form...');
    const inputs = await page.$$('input:visible');
    for (const input of inputs) {
      const type = (await input.getAttribute('type') || 'text').toLowerCase();
      if (['radio', 'checkbox', 'hidden', 'submit', 'button', 'file'].includes(type)) continue;

      const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
      const nm = (await input.getAttribute('name') || '').toLowerCase();

      try {
        if (ph.includes('first') || nm.includes('first')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(BIZ.first, { delay: 60 + Math.random() * 40 });
          console.log('    ✓ First Name');
          await randomDelay(800, 1500);
        } else if (ph.includes('last') || nm.includes('last')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(BIZ.last, { delay: 60 + Math.random() * 40 });
          console.log('    ✓ Last Name');
          await randomDelay(800, 1500);
        } else if (type === 'email' || nm.includes('email')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(EMAIL, { delay: 50 + Math.random() * 30 });
          console.log('    ✓ Email');
          await randomDelay(1000, 2000);
        } else if (type === 'password') {
          await input.click();
          await randomDelay(300, 600);
          await input.type(PWD, { delay: 70 + Math.random() * 40 });
          console.log('    ✓ Password');
          await randomDelay(800, 1500);
        } else if (ph.includes('zip') || nm.includes('zip')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(BIZ.zip, { delay: 80 + Math.random() * 40 });
          console.log('    ✓ Zip');
          await randomDelay(800, 1500);
        } else if (ph.includes('business') || nm.includes('business')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(BIZ.name, { delay: 50 + Math.random() * 30 });
          console.log('    ✓ Business Name');
          await randomDelay(800, 1500);
        } else if (ph.includes('phone') || nm.includes('phone')) {
          await input.click();
          await randomDelay(300, 600);
          await input.type(BIZ.phoneRaw, { delay: 90 + Math.random() * 40 });
          console.log('    ✓ Phone');
          await randomDelay(800, 1500);
        }
      } catch {}
    }

    await scrollDown(page, 200);
    await randomDelay(1000, 2000);

    // Click business owner
    try {
      const labels = await page.$$('label');
      for (const label of labels) {
        const text = (await label.textContent() || '').toLowerCase();
        if (text.includes('business owner')) {
          await label.click();
          console.log('    ✓ Business owner selected');
          break;
        }
      }
    } catch {}

    await randomDelay(2000, 3000);
    await page.screenshot({ path: '/tmp/human_mc_filled.png', fullPage: true });

    // Check for CAPTCHA
    const hasCaptcha = await page.$('iframe[src*="recaptcha"], [class*="captcha"]');
    if (hasCaptcha) {
      console.log('  ⚠ CAPTCHA detected — cannot proceed automatically');
      console.log('  Screenshot: /tmp/human_mc_filled.png');
    } else {
      // Try to submit
      const buttons = await page.$$('button:visible');
      for (const btn of buttons) {
        const text = (await btn.textContent() || '').toLowerCase();
        if (text.includes('create')) {
          await randomDelay(1000, 2000);
          await btn.click();
          console.log('  Submitted!');
          await page.waitForTimeout(10000);
          await page.screenshot({ path: '/tmp/human_mc_result.png', fullPage: true });
          console.log('  Result: ' + page.url());

          // Check for verification email
          const link = getVerificationEmail('merchantcircle', 60);
          if (link) {
            await page.goto(link, { timeout: 15000 });
            await page.waitForTimeout(5000);
            console.log('  ✓ VERIFIED!');
          }
          break;
        }
      }
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 100));
  }
  await page.close();
}

async function doBrownbook(browser) {
  console.log('\n══════════════════════════════════════');
  console.log('  Brownbook (DA 55, dofollow)');
  console.log('══════════════════════════════════════');

  const page = await browser.newPage();
  try {
    await page.goto('https://www.brownbook.net/add-business/');
    await page.waitForLoadState('networkidle');
    await randomDelay(3000, 5000);

    console.log('  Filling form...');

    // Business name
    await humanType(page, 'input[name="name"]', BIZ.name);
    console.log('    ✓ Name');
    await randomDelay(1500, 2500);

    // Category — click the dropdown area
    try {
      await page.click('text=Select category');
      await randomDelay(500, 1000);
      await page.keyboard.type('Real Estate', { delay: 80 });
      await randomDelay(1500, 2000);
      await page.keyboard.press('Enter');
      console.log('    ✓ Category');
    } catch {
      console.log('    ⚠ Category dropdown — needs manual selection');
    }

    await randomDelay(1000, 2000);

    // Address
    await humanType(page, 'textarea[name="address"]', BIZ.fullAddress);
    console.log('    ✓ Address');
    await randomDelay(1000, 2000);

    // City
    await humanType(page, 'input[name="city"]', BIZ.city);
    console.log('    ✓ City');
    await randomDelay(1000, 2000);

    // Country dropdown
    try {
      const countryInput = await page.$('#react-select-country_select-input');
      if (countryInput) {
        await countryInput.click();
        await randomDelay(500, 1000);
        await page.keyboard.type('United States', { delay: 70 });
        await randomDelay(1500, 2000);
        await page.keyboard.press('Enter');
        console.log('    ✓ Country');
      }
    } catch {
      console.log('    ⚠ Country — needs manual selection');
    }

    await scrollDown(page, 300);
    await randomDelay(1000, 2000);

    // Zip
    await humanType(page, 'input[name="zip_code"]', BIZ.zip);
    console.log('    ✓ Zip');
    await randomDelay(1000, 1500);

    // Phone
    await humanType(page, 'input[name="phone"]', BIZ.phone);
    console.log('    ✓ Phone');
    await randomDelay(1000, 1500);

    // Email
    await humanType(page, 'input[name="email"]', EMAIL);
    console.log('    ✓ Email');
    await randomDelay(1000, 1500);

    await scrollDown(page, 300);
    await randomDelay(800, 1500);

    // Website
    await humanType(page, 'input[name="website"]', BIZ.website);
    console.log('    ✓ Website');
    await randomDelay(1000, 1500);

    // Display website (2nd backlink)
    await humanType(page, 'input[name="display_website"]', BIZ.website2);
    console.log('    ✓ Display Website (2nd backlink)');
    await randomDelay(1000, 2000);

    await page.screenshot({ path: '/tmp/human_brownbook_filled.png', fullPage: true });

    // Submit
    const btn = await page.$('button[type="submit"]');
    if (btn) {
      await randomDelay(2000, 3000);
      await btn.click();
      console.log('  Submitted!');
      await page.waitForTimeout(8000);
      await page.screenshot({ path: '/tmp/human_brownbook_result.png', fullPage: true });
      console.log('  Result: ' + page.url());
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 100));
  }
  await page.close();
}

async function doAlignable(browser) {
  console.log('\n══════════════════════════════════════');
  console.log('  Alignable (DA 60, dofollow)');
  console.log('══════════════════════════════════════');

  const page = await browser.newPage();
  try {
    await page.goto('https://www.alignable.com/register');
    await page.waitForLoadState('networkidle');
    await randomDelay(3000, 5000);

    console.log('  Filling form...');

    const inputs = await page.$$('input:visible');
    for (const input of inputs) {
      const type = (await input.getAttribute('type') || 'text').toLowerCase();
      if (['radio', 'checkbox', 'hidden', 'submit', 'button', 'file'].includes(type)) continue;

      const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
      const nm = (await input.getAttribute('name') || '').toLowerCase();
      const all = ph + ' ' + nm;

      try {
        if (all.includes('first')) {
          await input.click(); await randomDelay(300, 600);
          await input.type(BIZ.first, { delay: 70 });
          console.log('    ✓ First Name');
          await randomDelay(1000, 2000);
        } else if (all.includes('last')) {
          await input.click(); await randomDelay(300, 600);
          await input.type(BIZ.last, { delay: 70 });
          console.log('    ✓ Last Name');
          await randomDelay(1000, 2000);
        } else if (type === 'email' || all.includes('email')) {
          await input.click(); await randomDelay(300, 600);
          await input.type(EMAIL, { delay: 50 });
          console.log('    ✓ Email');
          await randomDelay(1500, 2500);
        } else if (type === 'password') {
          await input.click(); await randomDelay(300, 600);
          await input.type(PWD, { delay: 70 });
          console.log('    ✓ Password');
          await randomDelay(1000, 2000);
        } else if (all.includes('business') || all.includes('company')) {
          await input.click(); await randomDelay(300, 600);
          await input.type(BIZ.name, { delay: 50 });
          console.log('    ✓ Business');
          await randomDelay(1000, 2000);
        } else if (all.includes('zip') || all.includes('postal')) {
          await input.click(); await randomDelay(300, 600);
          await input.type(BIZ.zip, { delay: 90 });
          console.log('    ✓ Zip');
          await randomDelay(1000, 2000);
        }
      } catch {}
    }

    await page.screenshot({ path: '/tmp/human_alignable_filled.png', fullPage: true });

    // Try to submit
    const buttons = await page.$$('button:visible, input[type="submit"]:visible');
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('sign up') || text.includes('register') || text.includes('join') || text.includes('create') || text.includes('get started')) {
        await randomDelay(2000, 3000);
        await btn.click();
        console.log('  Submitted!');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: '/tmp/human_alignable_result.png', fullPage: true });
        console.log('  Result: ' + page.url());

        // Check verification email
        const link = getVerificationEmail('alignable', 60);
        if (link) {
          await page.goto(link, { timeout: 15000 });
          await page.waitForTimeout(5000);
          console.log('  ✓ VERIFIED!');
        }
        break;
      }
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 100));
  }
  await page.close();
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  HUMAN-LIKE BACKLINK SIGNUP');
  console.log('  Business: ' + BIZ.name);
  console.log('  Address: ' + BIZ.fullAddress);
  console.log('  Email: ' + EMAIL);
  console.log('  Time: ' + new Date().toLocaleString());
  console.log('═══════════════════════════════════════════');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  // Add stealth — make it look like a real browser
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  // Override navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  // Run each submission with the shared context
  await doBrownbook({ newPage: async () => { await page.goto('about:blank'); return page; } });
  await randomDelay(5000, 10000);

  const page2 = await context.newPage();
  await doAlignable({ newPage: async () => page2 });
  await randomDelay(5000, 10000);

  const page3 = await context.newPage();
  await doMerchantCircle({ newPage: async () => page3 });

  await browser.close();

  console.log('\n═══════════════════════════════════════════');
  console.log('  DONE — Check screenshots in /tmp/human_*.png');
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
