require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AxePuppeteer = require('@axe-core/puppeteer').AxePuppeteer;
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const devices = require('./devices'); // Import devices from devices.js
const axios = require('axios'); // Axios for API requests
puppeteer.use(StealthPlugin());

// Load environment variables
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'audit';
const TARGET_URL = process.env.TARGET_URL;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!TARGET_URL || !GOOGLE_API_KEY) {
  console.error("TARGET_URL or GOOGLE_API_KEY not specified in .env file.");
  process.exit(1);
}

// Helper function to format date and time
function getFormattedDateTime() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '-')}`;
}

// Create a 'reports' directory if it doesn't exist, and create a new output folder for this audit
const reportsDir = 'reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}
const outputFolder = `${reportsDir}/${BUSINESS_NAME}_${getFormattedDateTime()}`;
fs.mkdirSync(outputFolder, { recursive: true });

// Function to call Google PageSpeed Insights API and get detailed feedback
async function fetchPageSpeedInsights(url, strategy) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${GOOGLE_API_KEY}&strategy=${strategy}`;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    
    // Basic metrics
    const performanceScore = data.lighthouseResult.categories.performance.score * 100;
    const metrics = {
      FCP: data.lighthouseResult.audits['first-contentful-paint'].displayValue,
      LCP: data.lighthouseResult.audits['largest-contentful-paint'].displayValue,
      CLS: data.lighthouseResult.audits['cumulative-layout-shift'].displayValue,
      TTI: data.lighthouseResult.audits['interactive'].displayValue,
      TBT: data.lighthouseResult.audits['total-blocking-time'].displayValue,
    };

    // Opportunities for improvement
    const opportunities = data.lighthouseResult.audits
      ? Object.values(data.lighthouseResult.audits)
          .filter(audit => audit.details && audit.details.type === 'opportunity')
          .map(audit => ({
            title: audit.title,
            description: audit.description,
            scoreImpact: audit.details.overallSavingsMs, // Potential impact in milliseconds
          }))
      : [];

    // Diagnostics information
    const diagnostics = data.lighthouseResult.audits
      ? Object.values(data.lighthouseResult.audits)
          .filter(audit => audit.details && audit.details.type === 'diagnostic')
          .map(audit => ({
            title: audit.title,
            description: audit.description,
            value: audit.displayValue || audit.numericValue,
          }))
      : [];

    return {
      strategy,
      performanceScore,
      metrics,
      opportunities,
      diagnostics,
    };
  } catch (error) {
    console.error(`Error fetching PageSpeed Insights for ${strategy}:`, error);
    return null;
  }
}

async function runMultiDeviceAudit() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true
  });

  let report = `Comprehensive Audit Report for ${TARGET_URL}\nGenerated: ${getFormattedDateTime()}\n\n`;

  // Fetch PageSpeed Insights for both desktop and mobile
  const psiMobile = await fetchPageSpeedInsights(TARGET_URL, 'mobile');
  const psiDesktop = await fetchPageSpeedInsights(TARGET_URL, 'desktop');

  if (psiMobile && psiDesktop) {
    report += `
      ---- Google PageSpeed Insights ----

      Mobile Performance Score: ${psiMobile.performanceScore}
      Mobile Metrics:
        - First Contentful Paint (FCP): ${psiMobile.metrics.FCP}
        - Largest Contentful Paint (LCP): ${psiMobile.metrics.LCP}
        - Cumulative Layout Shift (CLS): ${psiMobile.metrics.CLS}
        - Time to Interactive (TTI): ${psiMobile.metrics.TTI}
        - Total Blocking Time (TBT): ${psiMobile.metrics.TBT}

      Mobile Opportunities:
      ${psiMobile.opportunities.map(op => `
        * ${op.title}: ${op.description} (Potential Savings: ${op.scoreImpact}ms)
      `).join('\n')}

      Mobile Diagnostics:
      ${psiMobile.diagnostics.map(diag => `
        * ${diag.title}: ${diag.description} (Value: ${diag.value})
      `).join('\n')}

      Desktop Performance Score: ${psiDesktop.performanceScore}
      Desktop Metrics:
        - First Contentful Paint (FCP): ${psiDesktop.metrics.FCP}
        - Largest Contentful Paint (LCP): ${psiDesktop.metrics.LCP}
        - Cumulative Layout Shift (CLS): ${psiDesktop.metrics.CLS}
        - Time to Interactive (TTI): ${psiDesktop.metrics.TTI}
        - Total Blocking Time (TBT): ${psiDesktop.metrics.TBT}

      Desktop Opportunities:
      ${psiDesktop.opportunities.map(op => `
        * ${op.title}: ${op.description} (Potential Savings: ${op.scoreImpact}ms)
      `).join('\n')}

      Desktop Diagnostics:
      ${psiDesktop.diagnostics.map(diag => `
        * ${diag.title}: ${diag.description} (Value: ${diag.value})
      `).join('\n')}
    `;
  }

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
