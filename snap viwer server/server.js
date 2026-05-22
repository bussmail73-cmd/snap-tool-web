const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting - 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a moment.' },
});
app.use('/api/', limiter);

// ─── Helper: random delay ───────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Helper: parse shorthand numbers  e.g. "3M" → 3000000 ──────────────────
function parseCount(str) {
  if (!str || str === '—' || str === '-') return null;
  str = str.replace(/,/g, '').trim();
  const m = str.match(/^([\d.]+)\s*([KMBkmb]?)$/);
  if (!m) return null;
  let num = parseFloat(m[1]);
  const suffix = m[2].toUpperCase();
  if (suffix === 'K') num *= 1_000;
  else if (suffix === 'M') num *= 1_000_000;
  else if (suffix === 'B') num *= 1_000_000_000;
  return Math.round(num);
}

// ─── Format large numbers nicely ────────────────────────────────────────────
function formatNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// ─── Calculate Profile Strategy Score ───────────────────────────────────────
function calcScore(data) {
  let consistency = 0, engagement = 0, contentMix = 0, growthRate = 0;

  const subs = data.subscribers || 0;
  const stories = data.stories || 0;
  const highlights = data.highlights || 0;
  const spotlights = data.spotlights || 0;
  const views = data.totalViews || 0;

  // Consistency: based on stories + highlights uploaded
  if (stories > 0 || highlights > 0) {
    const total = stories + highlights;
    consistency = Math.min(100, 40 + total * 3);
  }

  // Engagement: views vs subscribers ratio
  if (subs > 0 && views > 0) {
    const ratio = views / subs;
    engagement = Math.min(100, Math.round(ratio * 10 + 30));
  } else if (subs > 0) {
    engagement = 20;
  }

  // Content Mix: variety of content types used
  let typesUsed = 0;
  if (stories > 0) typesUsed++;
  if (highlights > 0) typesUsed++;
  if (spotlights > 0) typesUsed++;
  contentMix = Math.min(100, typesUsed * 30 + (subs > 1000 ? 10 : 0));

  // Growth Rate: based on subscriber count brackets
  if (subs >= 1_000_000) growthRate = 90;
  else if (subs >= 100_000) growthRate = 70;
  else if (subs >= 10_000) growthRate = 55;
  else if (subs >= 1_000) growthRate = 40;
  else growthRate = 20;

  const overall = Math.round((consistency + engagement + contentMix + growthRate) / 4);

  return {
    overall: Math.min(100, overall),
    consistency: Math.min(100, consistency),
    engagement: Math.min(100, engagement),
    contentMix: Math.min(100, contentMix),
    growthRate: Math.min(100, growthRate),
  };
}

// ─── Main scrape function ────────────────────────────────────────────────────
async function scrapeSnapchat(username) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1280,800',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
      defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();

    // Block unnecessary resources for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) req.abort();
      else req.continue();
    });

    // Extra stealth headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://www.google.com/',
    });

    const url = `https://www.snapchat.com/add/${username}`;
    console.log(`[Scraper] Visiting: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    // Check if profile exists
    const notFound = await page.$('[data-testid="not-found"]');
    if (notFound) throw new Error('Profile not found');

    // ── Extract page JSON data from __NEXT_DATA__ ──
    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el ? el.textContent : null;
    });

    let profileData = {};

    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        // Snapchat embeds user data deep in props
        const props =
          json?.props?.pageProps?.userProfile?.publicProfileInfo ||
          json?.props?.pageProps?.userInfo ||
          json?.props?.pageProps ||
          {};

        profileData.displayName =
          props.title || props.displayName || props.name || username;
        profileData.bio = props.bio || props.description || '';
        profileData.avatarUrl =
          props.snapcodeImageUrl || props.bitmoji?.avatarImage?.url || props.profileImageUrl || '';

        // subscriber count
        const rawSubs =
          props.subscriberCount ||
          props.subscribers ||
          props.followerCount ||
          null;
        profileData.subscribers = rawSubs ? parseCount(String(rawSubs)) : null;

        profileData.stories = props.storiesCount || props.storyCount || 0;
        profileData.highlights = props.highlightCount || props.highlightsCount || 0;
        profileData.spotlights = props.spotlightCount || props.spotlightsCount || 0;
        profileData.totalViews = props.totalViewCount || props.viewCount || null;

      } catch (e) {
        console.warn('[Parser] __NEXT_DATA__ parse error:', e.message);
      }
    }

    // ── Fallback: DOM scraping ──────────────────────────────────────────────
    const domData = await page.evaluate(() => {
      const getText = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim() : null;
      };

      // Try multiple selectors Snapchat has used over time
      const name =
        getText('[data-testid="profile-display-name"]') ||
        getText('.PublicProfileCard_displayName__k5bum') ||
        getText('h1') ||
        document.title.split('(')[0].trim();

      const bio =
        getText('[data-testid="profile-bio"]') ||
        getText('.PublicProfileCard_bio__oH29D') ||
        '';

      const avatar =
        document.querySelector('[data-testid="profile-avatar"] img')?.src ||
        document.querySelector('meta[property="og:image"]')?.content ||
        '';

      // Subscriber count — Snapchat puts it in various places
      const allText = document.body.innerText;
      const subsMatch = allText.match(/([\d,.]+[KMB]?)\s*Subscribers?/i);
      const subscribers = subsMatch ? subsMatch[1] : null;

      const storiesMatch = allText.match(/([\d,.]+[KMB]?)\s*Stories?/i);
      const highlightsMatch = allText.match(/([\d,.]+[KMB]?)\s*Highlights?/i);
      const spotlightsMatch = allText.match(/([\d,.]+[KMB]?)\s*Spotlights?/i);
      const viewsMatch = allText.match(/([\d,.]+[KMB]?)\s*Total\s*Views?/i);

      return {
        name,
        bio,
        avatar,
        subscribers,
        stories: storiesMatch ? storiesMatch[1] : '0',
        highlights: highlightsMatch ? highlightsMatch[1] : '0',
        spotlights: spotlightsMatch ? spotlightsMatch[1] : '0',
        totalViews: viewsMatch ? viewsMatch[1] : null,
      };
    });

    // Merge: prefer nextData, fallback to DOM
    const final = {
      username,
      displayName: profileData.displayName || domData.name || username,
      bio: profileData.bio || domData.bio || '',
      avatarUrl: profileData.avatarUrl || domData.avatar || '',
      subscribers: profileData.subscribers ?? parseCount(domData.subscribers),
      stories: profileData.stories || parseCount(domData.stories) || 0,
      highlights: profileData.highlights || parseCount(domData.highlights) || 0,
      spotlights: profileData.spotlights || parseCount(domData.spotlights) || 0,
      totalViews: profileData.totalViews ?? parseCount(domData.totalViews),
      isVerified: true, // public profiles on Snapchat are verified
      profileUrl: url,
    };

    // Format for display
    final.subscribersFormatted = formatNum(final.subscribers);
    final.totalViewsFormatted = formatNum(final.totalViews);
    final.storiesFormatted = formatNum(final.stories);
    final.highlightsFormatted = formatNum(final.highlights);
    final.spotlightsFormatted = formatNum(final.spotlights);

    // Calculate score
    final.score = calcScore(final);

    return final;

  } finally {
    if (browser) await browser.close();
  }
}

// Helper: parse username from input
function parseUsername(input) {
  input = input.trim();
  const match = input.match(/snapchat\.com\/add\/([a-zA-Z0-9._-]+)/i);
  if (match) return match[1].toLowerCase();
  return input.replace(/^@/, '').toLowerCase();
}

// ─── API Route ───────────────────────────────────────────────────────────────
app.post('/api/profile', async (req, res) => {
  try {
    let { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    username = parseUsername(username);
    if (!username) return res.status(400).json({ error: 'Invalid username' });

    console.log(`[API] Fetching profile for: ${username}`);
    const data = await scrapeSnapchat(username);
    res.json({ success: true, data });

  } catch (err) {
    console.error('[API Error]', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch profile' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    let username = req.query.u || req.query.username || '';
    if (!username) return res.status(400).json({ error: 'Username required' });

    username = parseUsername(username);
    if (!username) return res.status(400).json({ error: 'Invalid username' });

    console.log(`[API] Fetching profile for: ${username}`);
    const data = await scrapeSnapchat(username);
    res.json({ success: true, data });

  } catch (err) {
    console.error('[API Error]', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch profile' });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve frontend
app.get('*', (_, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () => {
  console.log(`\n✅ Snapchat Profile Viewer running at: http://localhost:${PORT}\n`);
});
