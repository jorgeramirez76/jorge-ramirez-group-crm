const { chromium } = require('playwright');
const { execSync } = require('child_process');

const EMAIL = 'jorgeramirez76@icloud.com';
const PASSWORD = 'JRG2026BacklinkPwd!';
const BIZ = {
  name: 'The Jorge Ramirez Group',
  firstName: 'Jorge',
  lastName: 'Ramirez',
  phone: '9082307844',
  website: 'https://www.thejorgeramirezgroup.com',
  website2: 'https://www.aisalespipeline.com',
  city: 'Summit',
  state: 'NJ',
  zip: '07901',
  bio: 'The Jorge Ramirez Group at Keller Williams Premier Properties serves Central and Northern New Jersey specializing in luxury real estate. Over 15 years experience, 500+ homes sold in Summit, Short Hills, Chatham and surrounding communities.',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getVerificationLink(fromDomain, maxWaitSec = 60) {
  console.log(`  Waiting for verification email from ${fromDomain}...`);
  const startTime = Date.now();

  while ((Date.now() - startTime) < maxWaitSec * 1000) {
    try {
      const result = execSync(`osascript -e '
        tell application "Mail"
          check for new mail
          delay 2
          set msgs to messages of inbox
          set resultList to {}
          repeat with m in msgs
            if date received of m > (current date) - 300 then
              set senderAddr to sender of m
              if senderAddr contains "${fromDomain}" then
                set msgContent to content of m
                return msgContent
              end if
            end if
          end repeat
          return "NO_EMAIL"
        end tell
      '`, { timeout: 30000 }).toString().trim();

      if (result !== 'NO_EMAIL' && result.length > 10) {
        // Extract URL from email content
        const urlMatch = result.match(/https?:\/\/[^\s<>"]+(?:verify|confirm|activate|click|token)[^\s<>"]*/i);
        if (urlMatch) {
          console.log(`  Found verification link!`);
          return urlMatch[0];
        }
        // Try broader URL match
        const anyUrl = result.match(/https?:\/\/[^\s<>"]{20,}/);
        if (anyUrl) {
          console.log(`  Found URL in email`);
          return anyUrl[0];
        }
        console.log(`  Email found but no verification link detected`);
        return null;
      }
    } catch (e) {}

    execSync('sleep 5');
    process.stdout.write('.');
  }
  console.log(`  No email received within ${maxWaitSec}s`);
  return null;
}

async function clickVerificationLink(browser, url) {
  if (!url) return false;
  console.log(`  Opening verification link...`);
  const page = await browser.newPage();
  try {
    await page.goto(url, { timeout: 20000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/backlink_verified.png' });
    console.log(`  Verification page loaded: ${page.url()}`);
    await page.close();
    return true;
  } catch (e) {
    console.log(`  Verification failed: ${e.message.substring(0, 80)}`);
    await page.close();
    return false;
  }
}

async function signupMerchantCircle(browser) {
  console.log('\n=== MerchantCircle (DA 56) ===');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.merchantcircle.com/signup', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Fill form by iterating visible inputs
    const inputs = await page.$$('input:visible');
    for (const input of inputs) {
      const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
      const nm = (await input.getAttribute('name') || '').toLowerCase();
      const tp = (await input.getAttribute('type') || '').toLowerCase();

      if (ph.includes('first') || nm.includes('first')) await input.fill(BIZ.firstName);
      else if (ph.includes('last') || nm.includes('last')) await input.fill(BIZ.lastName);
      else if (tp === 'email' || nm.includes('email')) await input.fill(EMAIL);
      else if (tp === 'password') await input.fill(PASSWORD);
      else if (ph.includes('zip') || nm.includes('zip')) await input.fill(BIZ.zip);
      else if (ph.includes('business') || nm.includes('business')) await input.fill(BIZ.name);
      else if (ph.includes('phone') || nm.includes('phone')) await input.fill(BIZ.phone);
    }

    // Click business owner radio
    try {
      await page.click('label:has-text("business owner")', { timeout: 3000 });
    } catch {}

    await page.screenshot({ path: '/tmp/backlink_mc_filled.png', fullPage: true });

    // Submit
    try {
      await page.click('button:has-text("Create")', { timeout: 5000 });
      console.log('  Form submitted');
      await sleep(8000);
      await page.screenshot({ path: '/tmp/backlink_mc_result.png', fullPage: true });
      console.log('  Result URL: ' + page.url());

      // Check for email verification
      if (page.url().includes('verify') || page.url().includes('confirm')) {
        const link = getVerificationLink('merchantcircle', 60);
        if (link) await clickVerificationLink(browser, link);
      }

      return true;
    } catch (e) {
      console.log('  Submit error: ' + e.message.substring(0, 80));
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 80));
  }
  await page.close();
  return false;
}

async function signupAlignable(browser) {
  console.log('\n=== Alignable (DA 60, dofollow) ===');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.alignable.com/register', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    // Try filling signup form
    const inputs = await page.$$('input:visible');
    for (const input of inputs) {
      const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
      const nm = (await input.getAttribute('name') || '').toLowerCase();
      const tp = (await input.getAttribute('type') || '').toLowerCase();

      if (ph.includes('first') || nm.includes('first')) await input.fill(BIZ.firstName);
      else if (ph.includes('last') || nm.includes('last')) await input.fill(BIZ.lastName);
      else if (tp === 'email' || nm.includes('email')) await input.fill(EMAIL);
      else if (tp === 'password') await input.fill(PASSWORD);
      else if (ph.includes('business') || nm.includes('business')) await input.fill(BIZ.name);
      else if (ph.includes('zip') || nm.includes('zip')) await input.fill(BIZ.zip);
    }

    await page.screenshot({ path: '/tmp/backlink_alignable_filled.png', fullPage: true });

    // Look for submit button
    const btns = await page.$$('button:visible, input[type="submit"]:visible');
    for (const btn of btns) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('sign up') || text.includes('register') || text.includes('join') || text.includes('create')) {
        await btn.click();
        console.log('  Submitted');
        await sleep(8000);
        await page.screenshot({ path: '/tmp/backlink_alignable_result.png', fullPage: true });
        console.log('  Result: ' + page.url());

        const link = getVerificationLink('alignable', 60);
        if (link) await clickVerificationLink(browser, link);
        break;
      }
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 80));
  }
  await page.close();
}

async function signupHotfrog(browser) {
  console.log('\n=== Hotfrog (DA 52, dofollow) ===');
  const page = await browser.newPage();
  try {
    await page.goto('https://www.hotfrog.com/register/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    const inputs = await page.$$('input:visible');
    for (const input of inputs) {
      const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
      const nm = (await input.getAttribute('name') || '').toLowerCase();
      const tp = (await input.getAttribute('type') || '').toLowerCase();

      if (tp === 'email' || nm.includes('email') || ph.includes('email')) await input.fill(EMAIL);
      else if (tp === 'password') await input.fill(PASSWORD);
      else if (ph.includes('name') || nm.includes('name')) await input.fill(BIZ.firstName + ' ' + BIZ.lastName);
    }

    await page.screenshot({ path: '/tmp/backlink_hotfrog_filled.png', fullPage: true });

    const btns = await page.$$('button:visible');
    for (const btn of btns) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('register') || text.includes('sign up') || text.includes('create')) {
        await btn.click();
        console.log('  Submitted');
        await sleep(8000);
        await page.screenshot({ path: '/tmp/backlink_hotfrog_result.png', fullPage: true });

        const link = getVerificationLink('hotfrog', 60);
        if (link) await clickVerificationLink(browser, link);
        break;
      }
    }
  } catch (e) {
    console.log('  Error: ' + e.message.substring(0, 80));
  }
  await page.close();
}

async function main() {
  console.log('=== Backlink Signup Automation with Email Verification ===');
  console.log('Email: ' + EMAIL);
  console.log('Time: ' + new Date().toISOString());
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  await signupMerchantCircle(browser);
  await signupAlignable(browser);
  await signupHotfrog(browser);

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(console.error);
