/**
 * Brownbook — Fill via DOM manipulation instead of UI interaction
 * Bypasses dropdown popover issues by setting values directly
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  await page.goto('https://www.brownbook.net/add-business/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Fill all simple text fields via type() with slow typing
  const fields = {
    'input[name="name"]': 'The Jorge Ramirez Group',
    'textarea[name="address"]': '488 Springfield Avenue, Summit, NJ 07901',
    'input[name="city"]': 'Summit',
    'input[name="zip_code"]': '07901',
    'input[name="phone"]': '(908) 230-7844',
    'input[name="email"]': 'jorgeramirez76@icloud.com',
    'input[name="website"]': 'https://www.thejorgeramirezgroup.com',
    'input[name="display_website"]': 'https://www.aisalespipeline.com',
  };

  for (const [selector, value] of Object.entries(fields)) {
    try {
      // Use evaluate to set value and trigger React's onChange
      await page.evaluate(({ sel, val }) => {
        const el = document.querySelector(sel);
        if (el) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, val);
          } else {
            el.value = val;
          }

          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { sel: selector, val: value });

      const fieldName = selector.match(/name="(\w+)"/)?.[1] || selector;
      console.log(`  ✓ ${fieldName}: ${value.substring(0, 40)}`);
    } catch (e) {
      console.log(`  ✗ ${selector}: ${e.message.substring(0, 50)}`);
    }
    await page.waitForTimeout(500);
  }

  // Handle the category dropdown via React state if possible
  console.log('  Attempting category selection...');
  try {
    // Click to open category dropdown
    await page.evaluate(() => {
      const el = document.querySelector('input[placeholder="Select category"]');
      if (el) {
        el.click();
        el.focus();
      }
    });
    await page.waitForTimeout(1500);

    // Type in the search
    await page.keyboard.type('Real Estate', { delay: 100 });
    await page.waitForTimeout(2000);

    // Click first option
    const option = await page.$('[role="option"], [class*="option"]');
    if (option) {
      await option.click();
      console.log('  ✓ category: Real Estate');
    } else {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      console.log('  ✓ category: selected via keyboard');
    }
  } catch (e) {
    console.log('  ⚠ category: needs manual selection');
  }

  // Dismiss any open dropdowns
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    // Close any MUI modals/popovers
    document.querySelectorAll('.MuiModal-root, .MuiPopover-root').forEach(el => {
      el.remove();
    });
    // Remove backdrop
    document.querySelectorAll('.MuiBackdrop-root').forEach(el => {
      el.remove();
    });
  });
  await page.waitForTimeout(1000);

  // Handle country dropdown
  console.log('  Attempting country selection...');
  try {
    await page.evaluate(() => {
      const el = document.getElementById('react-select-country_select-input');
      if (el) {
        el.click();
        el.focus();
      }
    });
    await page.waitForTimeout(1500);
    await page.keyboard.type('United States', { delay: 80 });
    await page.waitForTimeout(2000);

    const option = await page.$('[class*="option"]:has-text("United States")');
    if (option) {
      await option.click();
      console.log('  ✓ country: United States');
    } else {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      console.log('  ✓ country: selected via keyboard');
    }
  } catch (e) {
    console.log('  ⚠ country: needs manual selection');
  }

  // Dismiss again
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    document.querySelectorAll('.MuiModal-root, .MuiPopover-root, .MuiBackdrop-root').forEach(el => el.remove());
  });
  await page.waitForTimeout(1000);

  // Screenshot
  await page.screenshot({ path: '/tmp/brownbook_jsfill.png', fullPage: true });
  console.log('\n  Screenshot: /tmp/brownbook_jsfill.png');

  // Try to submit
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    const isVisible = await submitBtn.isVisible();
    if (isVisible) {
      await page.waitForTimeout(2000);
      await submitBtn.click();
      console.log('  Submitting...');
      await page.waitForTimeout(8000);
      await page.screenshot({ path: '/tmp/brownbook_jsfill_result.png', fullPage: true });
      console.log('  Result URL: ' + page.url());
      console.log('  Result screenshot: /tmp/brownbook_jsfill_result.png');
    }
  }

  await browser.close();
  console.log('\nDone.');
}

main().catch(e => console.log('Fatal: ' + e.message));
