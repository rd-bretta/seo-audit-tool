require('dotenv').config(); // Load environment variables from .env file
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AxePuppeteer = require('@axe-core/puppeteer').AxePuppeteer;
const fs = require('fs');
const archiver = require('archiver');
puppeteer.use(StealthPlugin());

// Load environment variables
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'audit';
const TARGET_URL = process.env.TARGET_URL;

if (!TARGET_URL) {
  console.error("No TARGET_URL specified in .env file.");
  process.exit(1);
}

// Define devices for emulation
const relevantDevices = [
  { name: 'iPhone 12', viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  { name: 'Pixel 5', viewport: { width: 393, height: 851, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36' },
  { name: 'iPad Pro', viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/604.1' },
  { name: 'Desktop 1920x1080', viewport: { width: 1920, height: 1080, isMobile: false }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
  { name: 'Desktop 1366x768', viewport: { width: 1366, height: 768, isMobile: false }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
];

// Helper function to format date and time
function getFormattedDateTime() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '-')}`;
}

// Create a dynamically named folder
const outputFolder = `${BUSINESS_NAME}_${getFormattedDateTime()}`;
fs.mkdirSync(outputFolder, { recursive: true });

async function runMultiDeviceAudit() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true
  });

  let report = `Comprehensive Audit Report for ${TARGET_URL}\nGenerated: ${getFormattedDateTime()}\n\n`;

  for (const device of relevantDevices) {
    const page = await browser.newPage();

    await page.setViewport(device.viewport);
    await page.setUserAgent(device.userAgent);

    try {
      const startTime = Date.now();
      await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
      const loadTime = Date.now() - startTime;

      const screenshotFilename = `${outputFolder}/screenshot_${device.name.replace(/\s/g, '_')}.png`;
      await page.screenshot({ path: screenshotFilename, fullPage: true });

      const seoData = await page.evaluate(() => {
        return {
          title: document.querySelector('title')?.innerText || '',
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          h1: document.querySelector('h1')?.innerText || '',
          h2: [...document.querySelectorAll('h2')].map(el => el.innerText),
          h3: [...document.querySelectorAll('h3')].map(el => el.innerText),
          images: [...document.querySelectorAll('img')].map(img => ({
            src: img.src,
            alt: img.alt,
          })),
          links: [...document.querySelectorAll('a')].map(link => ({
            href: link.href,
            text: link.innerText,
          })),
        };
      });

      const accessibilityResults = await new AxePuppeteer(page).analyze();

      report += `
        ===============================
        Device: ${device.name}
        User-Agent: ${device.userAgent}
        Viewport: ${device.viewport.width}x${device.viewport.height}
        Load Time: ${loadTime}ms
        Screenshot: ${screenshotFilename}
        ---- SEO Metadata ----
        Title: ${seoData.title}
        Description: ${seoData.description}
        Keywords: ${seoData.keywords}
        H1 Tag: ${seoData.h1}
        H2 Tags: ${seoData.h2.join(', ')}
        H3 Tags: ${seoData.h3.join(', ')}
        Images: ${seoData.images.map(img => `SRC: ${img.src}, ALT: ${img.alt}`).join('\n')}
        Links: ${seoData.links.map(link => `HREF: ${link.href}, Text: ${link.text}`).join('\n')}
        ---- Accessibility Violations ----
        Total Violations: ${accessibilityResults.violations.length}
        ${accessibilityResults.violations.map(violation => `
          Description: ${violation.description}
          Impact: ${violation.impact}
          Nodes: ${violation.nodes.length}
          Elements: ${violation.nodes.map(node => `- HTML: ${node.html}`).join('\n')}
        `).join('\n')}
        ===============================
      `;
      
    } catch (error) {
      console.error(`Error on device ${device.name}:`, error);
      report += `Error on device ${device.name}: ${error.message}\n`;
    } finally {
      await page.close();
    }
  }

  const reportFilename = `${outputFolder}/audit_report_${getFormattedDateTime()}.txt`;
  fs.writeFileSync(reportFilename, report);

  // Zip the folder
  const zipFilename = `${outputFolder}.zip`;
  const output = fs.createWriteStream(zipFilename);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(outputFolder, false);
  await archive.finalize();

  console.log(`Comprehensive audit report saved as ${zipFilename}`);

  await browser.close();
}

runMultiDeviceAudit();
