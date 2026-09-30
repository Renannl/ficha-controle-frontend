const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER EXCEPTION:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:5173');
  await page.waitForSelector('.btn-ghost', { timeout: 5000 });
  
  const buttons = await page.$$('.btn-ghost');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Abrir')) {
      await btn.click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  await browser.close();
})();
