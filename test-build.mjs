import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const server = exec('npx vite preview --port 4174');

setTimeout(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERR:', err.message));
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle0' });
    const content = await page.content();
    console.log('HTML length:', content.length);
    await browser.close();
  } catch (e) {
    console.error(e);
  }
  server.kill();
  process.exit();
}, 2000);
