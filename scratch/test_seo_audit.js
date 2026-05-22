import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log("PROJECT_ROOT:", PROJECT_ROOT);

function runSeoAudit() {
  const indexHtmlPath = path.join(PROJECT_ROOT, "index.html");
  let score = 0;
  const auditDetails = [];

  try {
    if (!fs.existsSync(indexHtmlPath)) {
      return { score: 0, details: [{ name: "Index.html File", status: "fail", score: 0, description: "index.html does not exist in project root" }] };
    }

    const html = fs.readFileSync(indexHtmlPath, "utf-8");
    const $ = cheerio.load(html);

    // 1. Title Tag
    const title = $("title").text();
    if (title) {
      const len = title.length;
      if (len >= 40 && len <= 80) {
        score += 10;
        auditDetails.push({ name: "Title Tag", status: "pass", score: 10, description: `Title is perfect (${len} chars): "${title}"` });
      } else {
        score += 6;
        auditDetails.push({ name: "Title Tag", status: "warning", score: 6, description: `Title is too ${len < 40 ? "short" : "long"} (${len} chars, recommended 45-75)` });
      }
    } else {
      auditDetails.push({ name: "Title Tag", status: "fail", score: 0, description: "Title tag is missing!" });
    }

    // 2. Meta Description
    const metaDesc = $('meta[name="description"]').attr("content");
    if (metaDesc) {
      const len = metaDesc.length;
      if (len >= 100 && len <= 200) {
        score += 10;
        auditDetails.push({ name: "Meta Description", status: "pass", score: 10, description: `Meta description length is excellent (${len} chars)` });
      } else {
        score += 6;
        auditDetails.push({ name: "Meta Description", status: "warning", score: 6, description: `Description is too ${len < 100 ? "short" : "long"} (${len} chars, recommended 120-160)` });
      }
    } else {
      auditDetails.push({ name: "Meta Description", status: "fail", score: 0, description: "Meta description tag is missing!" });
    }

    // 3. Robots
    const robots = $('meta[name="robots"]').attr("content");
    if (robots) {
      score += 10;
      auditDetails.push({ name: "Robots Tag", status: "pass", score: 10, description: `Robots tag configured: "${robots}"` });
    } else {
      auditDetails.push({ name: "Robots Tag", status: "fail", score: 0, description: "Robots meta tag is missing (critical for crawler guidance)" });
    }

    // 4. Canonical Link
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical) {
      score += 10;
      auditDetails.push({ name: "Canonical URL", status: "pass", score: 10, description: `Canonical link configured: "${canonical}"` });
    } else {
      auditDetails.push({ name: "Canonical URL", status: "fail", score: 0, description: "Canonical link is missing (causes duplicate content risk)" });
    }

    // 5. OpenGraph Tags
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogUrl = $('meta[property="og:url"]').attr("content");
    if (ogTitle && ogImage && ogUrl) {
      score += 15;
      auditDetails.push({ name: "OpenGraph Metadata", status: "pass", score: 15, description: "Full OpenGraph protocol configured (og:title, og:image, og:url)" });
    } else {
      score += 5;
      auditDetails.push({ name: "OpenGraph Metadata", status: "warning", score: 5, description: "Some OpenGraph tags are missing (recommended for rich social cards)" });
    }

    // 6. Twitter Cards
    const twitterCard = $('meta[name="twitter:card"]').attr("content");
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    if (twitterCard && twitterTitle) {
      score += 10;
      auditDetails.push({ name: "Twitter Cards", status: "pass", score: 10, description: "Twitter card metadata is fully configured" });
    } else {
      score += 3;
      auditDetails.push({ name: "Twitter Cards", status: "warning", score: 3, description: "Twitter meta tags are missing or incomplete" });
    }

    // 7. Schema Markup (structured JSON-LD)
    let hasSchema = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      if ($(el).html()) hasSchema = true;
    });
    if (hasSchema) {
      score += 15;
      auditDetails.push({ name: "JSON-LD Schema Markup", status: "pass", score: 15, description: "Structured Schema.org data found in index.html" });
    } else {
      auditDetails.push({ name: "JSON-LD Schema Markup", status: "fail", score: 0, description: "No structured JSON-LD schemas found (important for rich snippets)" });
    }

    // 8. Viewport Tag
    const viewport = $('meta[name="viewport"]').attr("content");
    if (viewport) {
      score += 10;
      auditDetails.push({ name: "Mobile Viewport", status: "pass", score: 10, description: "Responsive viewport configured for mobile compatibility" });
    } else {
      auditDetails.push({ name: "Mobile Viewport", status: "fail", score: 0, description: "Mobile viewport meta tag is missing (ruins responsiveness)" });
    }

    // 9. Semantic HTML Elements
    const h1Count = $("h1").length;
    const navCount = $("nav, header").length;
    const footerCount = $("footer").length;
    if (h1Count === 1 && (navCount > 0 || footerCount > 0)) {
      score += 5;
      auditDetails.push({ name: "Semantic Structure", status: "pass", score: 5, description: "Perfect header/footer/single H1 tag hierarchy detected" });
    } else {
      score += 2;
      auditDetails.push({ name: "Semantic Structure", status: "warning", score: 2, description: `H1 tags count is ${h1Count} (recommended exactly 1 for SEO)` });
    }

    // 10. DNS Prefetch / Preconnect Links
    const preconnect = $('link[rel="preconnect"], link[rel="dns-prefetch"]').length;
    if (preconnect > 0) {
      score += 5;
      auditDetails.push({ name: "Preconnect Optimization", status: "pass", score: 5, description: `${preconnect} speed optimization preconnect links found` });
    } else {
      score += 2;
      auditDetails.push({ name: "Preconnect Optimization", status: "warning", score: 2, description: "No preconnect links found for assets/Google Fonts" });
    }

  } catch (err) {
    console.error("SEO Audit Error:", err.message);
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return {
    score: finalScore,
    details: auditDetails
  };
}

console.log("Running SEO Audit...");
console.log(JSON.stringify(runSeoAudit(), null, 2));
