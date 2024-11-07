require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AxePuppeteer = require('@axe-core/puppeteer').AxePuppeteer;
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const devices = require('./devices'); // Import devices from devices.js
puppeteer.use(StealthPlugin());

// Load environment variables
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'audit';
const TARGET_URL = process.env.TARGET_URL;

if (!TARGET_URL) {
  console.error("No TARGET_URL specified in .env file.");
  process.exit(1);
}

function getFormattedDateTime() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '-')}`;
}

const reportsDir = 'reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}
const outputFolder = `${reportsDir}/${BUSINESS_NAME}_${getFormattedDateTime()}`;
fs.mkdirSync(outputFolder, { recursive: true });

async function runMultiDeviceAudit() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true
  });

  let report = `Comprehensive Audit Report for ${TARGET_URL}\nGenerated: ${getFormattedDateTime()}\n\n`;

  for (const device of devices) {
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
          images: [...document.querySelectorAll('img')].map(img => {
            const rect = img.getBoundingClientRect();
            return {
              src: img.src,
              alt: img.alt,
              width: rect.width,
              height: rect.height
            };
          }),
          links: [...document.querySelectorAll('a')].map(link => ({
            href: link.href,
            text: link.innerText,
          })),
        };
      });

      // Additional step to get image file sizes
      const imageDataWithSize = await Promise.all(
        seoData.images.map(async (img) => {
          try {
            const response = await page.goto(img.src);
            const buffer = await response.buffer();
            img.fileSize = buffer.length;
          } catch (e) {
            img.fileSize = 'N/A';
          }
          return img;
        })
      );

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
        Images: ${imageDataWithSize.map(img => `SRC: ${img.src}, ALT: ${img.alt}, Width: ${img.width}px, Height: ${img.height}px, File Size: ${img.fileSize} bytes`).join('\n')}
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
