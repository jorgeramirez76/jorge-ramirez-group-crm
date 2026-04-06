const { chromium } = require('playwright');
const { execSync } = require('child_process');

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('[MerchantCircle] Loading signup...');
  await page.goto('https://www.merchantcircle.com/signup', { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  // Fill only text/email/password inputs — skip radio buttons
  const inputs = await page.$$('input:visible');
  for (const input of inputs) {
    const type = (await input.getAttribute('type') || 'text').toLowerCase();
    // Skip radio, checkbox, hidden, submit
    if (['radio', 'checkbox', 'hidden', 'submit', 'button'].includes(type)) continue;

    const ph = (await input.getAttribute('placeholder') || '').toLowerCase();
    const nm = (await input.getAttribute('name') || '').toLowerCase();

    try {
      if (ph.includes('first') || nm.includes('first')) {
        await input.fill('Jorge');
        console.log('  ✓ First Name');
      } else if (ph.includes('last') || nm.includes('last')) {
        await input.fill('Ramirez');
        console.log('  ✓ Last Name');
      } else if (type === 'email' || nm.includes('email') || ph.includes('email')) {
        await input.fill('jorgeramirez76@icloud.com');
        console.log('  ✓ Email');
      } else if (type === 'password') {
        await input.fill('JRG2026BacklinkPwd!');
        console.log('  ✓ Password');
      } else if (ph.includes('zip') || nm.includes('zip')) {
        await input.fill('07901');
        console.log('  ✓ Zip');
      } else if (ph.includes('business') || nm.includes('business')) {
        await input.fill('The Jorge Ramirez Group');
        console.log('  ✓ Business Name');
      } else if (ph.includes('phone') || nm.includes('phone')) {
        await input.fill('9082307844');
        console.log('  ✓ Phone');
      }
    } catch (e) {
      // Skip any fields that can't be filled
    }
  }

  // Click "I'm claiming as the business owner" label
  try {
    const labels = await page.$$('label');
    for (const label of labels) {
      const text = (await label.textContent() || '').toLowerCase();
      if (text.includes('business owner')) {
        await label.click();
        console.log('  ✓ Selected business owner');
        break;
      }
    }
  } catch {}

  await page.screenshot({ path: '/tmp/mc_final_filled.png', fullPage: true });
  console.log('  Screenshot saved');

  // Click Create my account
  try {
    const buttons = await page.$$('button:visible');
    for (const btn of buttons) {
      const text = (await btn.textContent() || '').toLowerCase();
      if (text.includes('create')) {
        console.log('  Clicking Create my account...');
        await btn.click();
        break;
      }
    }
  } catch {}

  // Wait for result
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/tmp/mc_final_result.png', fullPage: true });
  console.log('  Result URL: ' + page.url());

  // Check for verification email
  console.log('  Checking for verification email...');
  await page.waitForTimeout(10000);

  try {
    const emailContent = execSync(`osascript -e '
      tell application "Mail"
        check for new mail
        delay 5
        set msgs to messages of inbox
        repeat with m in msgs
          if date received of m > (current date) - 120 then
            set senderAddr to sender of m
            if senderAddr contains "merchantcircle" or senderAddr contains "merchant" then
              return content of m
            end if
          end if
        end repeat
        return "NO_EMAIL"
      end tell
    '`, { timeout: 30000 }).toString().trim();

    if (emailContent !== 'NO_EMAIL') {
      console.log('  ✓ Verification email received!');
      const urlMatch = emailContent.match(/https?:\/\/[^\s<>"]+/g);
      if (urlMatch) {
        // Find the verification URL
        const verifyUrl = urlMatch.find(u =>
          u.includes('verify') || u.includes('confirm') || u.includes('activate') || u.includes('click')
        ) || urlMatch[0];
        console.log('  Opening verification link: ' + verifyUrl.substring(0, 60) + '...');
        await page.goto(verifyUrl, { timeout: 15000 });
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/tmp/mc_verified.png' });
        console.log('  ✓ VERIFIED!');
      }
    } else {
      console.log('  No verification email yet — may take a few minutes');
    }
  } catch (e) {
    console.log('  Email check error: ' + e.message.substring(0, 60));
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => console.log('Fatal: ' + e.message));
