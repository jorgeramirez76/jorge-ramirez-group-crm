/**
 * Automated Backlink Submission Script
 * Submits business profiles to directories that don't require CAPTCHA
 * Uses Playwright for browser automation
 */

const { chromium } = require('playwright');

const BUSINESS = {
  name: 'The Jorge Ramirez Group',
  fullName: 'The Jorge Ramirez Group at Keller Williams Premier Properties',
  owner: 'George Ramirez',
  phone: '(908) 230-7844',
  email: 'george@thejorgeramirezgroup.com',
  website1: 'https://www.thejorgeramirezgroup.com',
  website2: 'https://www.aisalespipeline.com',
  city: 'Summit',
  state: 'NJ',
  zip: '07901',
  category: 'Real Estate',
  bio: 'George Ramirez leads The Jorge Ramirez Group at Keller Williams Premier Properties, serving Central and Northern New Jersey with a specialty in luxury markets including Summit, Short Hills, and Chatham. With over 15 years of experience and more than 500 homes sold, George combines deep local market expertise with cutting-edge technology to deliver exceptional results.',
  shortBio: '15+ years | 500+ homes sold | Summit, Short Hills, Chatham NJ | Keller Williams Premier Properties',
  aiBio: 'AI Sales Pipeline is an AI-powered CRM and sales automation platform built specifically for real estate professionals. Automate follow-ups, book appointments, close more deals.',
};

const results = [];

async function submitHotfrog(page) {
  console.log('\n[Hotfrog] Starting submission...');
  try {
    await page.goto('https://www.hotfrog.com/add-a-business/', { timeout: 15000 });

    // Check for form fields
    const hasForm = await page.$('input[name="business_name"], input[name="company"], #business_name');
    if (!hasForm) {
      console.log('[Hotfrog] Form not found or requires login first');
      results.push({ site: 'Hotfrog', status: 'needs_login', url: 'https://www.hotfrog.com/add-a-business/' });
      return;
    }

    await page.fill('input[name="business_name"]', BUSINESS.name).catch(() => {});
    await page.fill('input[name="phone"]', BUSINESS.phone).catch(() => {});
    await page.fill('input[name="website"]', BUSINESS.website1).catch(() => {});
    await page.fill('input[name="city"]', BUSINESS.city).catch(() => {});

    console.log('[Hotfrog] Form filled');
    results.push({ site: 'Hotfrog', status: 'form_filled', note: 'May need manual submit' });
  } catch (e) {
    console.log(`[Hotfrog] Error: ${e.message}`);
    results.push({ site: 'Hotfrog', status: 'error', error: e.message });
  }
}

async function submitBrownbook(page) {
  console.log('\n[Brownbook] Starting submission...');
  try {
    await page.goto('https://www.brownbook.net/add-business/', { timeout: 15000 });

    const hasForm = await page.$('input, form');
    if (!hasForm) {
      console.log('[Brownbook] Needs account');
      results.push({ site: 'Brownbook', status: 'needs_account', url: 'https://www.brownbook.net/add-business/' });
      return;
    }

    // Try to fill available fields
    for (const [selector, value] of [
      ['input[name*="name"], #business_name, #name', BUSINESS.name],
      ['input[name*="phone"], #phone', BUSINESS.phone],
      ['input[name*="website"], input[name*="url"], #website', BUSINESS.website1],
      ['input[name*="city"], #city', BUSINESS.city],
      ['input[name*="email"], #email', BUSINESS.email],
      ['textarea[name*="description"], #description', BUSINESS.bio],
    ]) {
      try {
        const el = await page.$(selector);
        if (el) await el.fill(value);
      } catch {}
    }

    console.log('[Brownbook] Form filled');
    results.push({ site: 'Brownbook', status: 'form_filled' });
  } catch (e) {
    results.push({ site: 'Brownbook', status: 'error', error: e.message });
  }
}

async function submitPRLog(page) {
  console.log('\n[PRLog] Starting press release submission...');
  try {
    await page.goto('https://www.prlog.org/register.html', { timeout: 15000 });

    const title = await page.title();
    console.log(`[PRLog] Page: ${title}`);

    // Check if registration form exists
    const emailField = await page.$('input[type="email"], input[name="email"], #email');
    if (emailField) {
      await emailField.fill(BUSINESS.email);
      console.log('[PRLog] Email filled — needs manual completion (password, verification)');
    }

    results.push({ site: 'PRLog', status: 'registration_started', url: 'https://www.prlog.org/register.html', note: 'Complete registration, then submit press release' });
  } catch (e) {
    results.push({ site: 'PRLog', status: 'error', error: e.message });
  }
}

async function createBloggerPost() {
  console.log('\n[Blogger] Creating blog via API requires Google OAuth — skipping API route');
  console.log('[Blogger] Manual: go to blogger.com, create blog, paste article from docs/articles/');
  results.push({ site: 'Blogger', status: 'manual_required', url: 'https://www.blogger.com', note: 'Article ready at docs/articles/blogger_ai_followups.md' });
}

async function checkSiteAccessibility(page, url, siteName) {
  console.log(`\n[${siteName}] Checking ${url}...`);
  try {
    await page.goto(url, { timeout: 15000 });
    const title = await page.title();
    const hasCaptcha = await page.$('[class*="captcha"], [class*="recaptcha"], [id*="captcha"], iframe[src*="captcha"], iframe[src*="recaptcha"]');
    const hasForm = await page.$('form');

    console.log(`[${siteName}] Title: ${title}`);
    console.log(`[${siteName}] Has form: ${!!hasForm}, Has CAPTCHA: ${!!hasCaptcha}`);

    results.push({
      site: siteName,
      status: hasCaptcha ? 'has_captcha' : (hasForm ? 'submittable' : 'no_form'),
      url,
      hasCaptcha: !!hasCaptcha,
      hasForm: !!hasForm,
    });

    return { hasCaptcha: !!hasCaptcha, hasForm: !!hasForm };
  } catch (e) {
    results.push({ site: siteName, status: 'error', error: e.message });
    return { hasCaptcha: true, hasForm: false };
  }
}

async function main() {
  console.log('=== Backlink Submission Automation ===');
  console.log(`Business: ${BUSINESS.name}`);
  console.log(`Websites: ${BUSINESS.website1} | ${BUSINESS.website2}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Phase 1: Check which sites are submittable without CAPTCHA
  console.log('=== Phase 1: Scanning sites ===');

  const sitesToCheck = [
    ['https://www.hotfrog.com/add-a-business/', 'Hotfrog (dofollow DA 52)'],
    ['https://www.brownbook.net/add-business/', 'Brownbook (dofollow DA 55)'],
    ['https://www.cylex.us.com/add-company', 'Cylex (dofollow DA 50)'],
    ['https://www.prlog.org/register.html', 'PRLog (DA 70)'],
    ['https://www.openpr.com/news/submit.html', 'OpenPR (dofollow DA 65)'],
    ['https://www.manta.com/claim', 'Manta (DA 61)'],
    ['https://www.merchantcircle.com/signup', 'MerchantCircle (DA 56)'],
    ['https://www.alignable.com/register', 'Alignable (dofollow DA 60)'],
  ];

  for (const [url, name] of sitesToCheck) {
    await checkSiteAccessibility(page, url, name);
    await page.waitForTimeout(2000); // Be polite
  }

  // Phase 2: Submit to sites without CAPTCHA
  console.log('\n=== Phase 2: Submitting to open sites ===');

  const submittable = results.filter(r => r.status === 'submittable' && !r.hasCaptcha);
  console.log(`Found ${submittable.length} sites without CAPTCHA`);

  for (const site of submittable) {
    if (site.site.includes('Hotfrog')) await submitHotfrog(page);
    if (site.site.includes('Brownbook')) await submitBrownbook(page);
    if (site.site.includes('PRLog')) await submitPRLog(page);
  }

  await createBloggerPost();

  await browser.close();

  // Summary
  console.log('\n=== RESULTS SUMMARY ===');
  for (const r of results) {
    const icon = r.status === 'form_filled' ? '✓' :
                 r.status === 'submittable' ? '◉' :
                 r.status === 'has_captcha' ? '🔒' : '⚠';
    console.log(`  ${icon} ${r.site}: ${r.status}${r.note ? ` — ${r.note}` : ''}`);
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('/tmp/backlink_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to /tmp/backlink_results.json');
}

main().catch(console.error);
