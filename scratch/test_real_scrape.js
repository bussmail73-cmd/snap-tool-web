import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS_MOBILE = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache"
};

async function fetchProfile(username) {
  const pageUrl = `https://www.snapchat.com/add/${username}`;
  console.log(`Fetching ${pageUrl}...`);
  try {
    const response = await axios.get(pageUrl, {
      headers: HEADERS_MOBILE,
      timeout: 10000,
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
    }
    return null;
  }
}

function parseNumber(str) {
  if (!str) return 0;
  const clean = str.toUpperCase().replace(/[,\s]/g, "");
  if (clean.endsWith("K")) return Math.floor(parseFloat(clean) * 1000);
  if (clean.endsWith("M")) return Math.floor(parseFloat(clean) * 1000000);
  if (clean.endsWith("B")) return Math.floor(parseFloat(clean) * 1000000000);
  return parseInt(clean) || 0;
}

function scrapeProfile(html, username) {
  const $ = cheerio.load(html);
  
  // Extract profile data from page
  let displayName = ($('meta[property="og:title"]').attr("content") || username)
    .replace(/\s+on Snapchat$/i, "")
    .trim();
  let avatar = $('meta[property="og:image"]').attr("content") || 
                $('meta[name="twitter:image"]').attr("content") || "";
  let bio = ($('meta[property="og:description"]').attr("content") || "").substring(0, 500);
  let snapcode = `https://app.snapchat.com/web/deeplink/snapcode?username=${username}&type=SVG&bitmoji=enable`;

  let subscribers = null;
  let stories = null;
  let highlights = null;
  let spotlights = null;
  let totalViews = null;
  
  // Method 1: Try to extract from Next.js payload (__NEXT_DATA__)
  let methodUsed = "none";
  try {
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (nextDataScript) {
      const nextData = JSON.parse(nextDataScript.trim());
      const pageProps = nextData.props?.pageProps;
      if (pageProps) {
        methodUsed = "NEXT_DATA";
        const publicProfileInfo = pageProps.userProfile?.publicProfileInfo;
        if (publicProfileInfo) {
          if (publicProfileInfo.title) displayName = publicProfileInfo.title.trim();
          if (publicProfileInfo.bio) bio = publicProfileInfo.bio.trim().substring(0, 500);
          if (publicProfileInfo.profilePictureUrl) avatar = publicProfileInfo.profilePictureUrl;
          if (publicProfileInfo.snapcodeImageUrl) snapcode = publicProfileInfo.snapcodeImageUrl;
          
          if (publicProfileInfo.subscriberCount !== undefined && publicProfileInfo.subscriberCount !== null) {
            const subCount = Number(publicProfileInfo.subscriberCount);
            if (!isNaN(subCount)) subscribers = subCount;
          }
        }
        
        // Calculate stories count
        if (pageProps.story?.snapList) {
          stories = pageProps.story.snapList.length;
        } else if (publicProfileInfo?.hasStory) {
          stories = 0;
        }
        
        // Calculate curated highlights count (videos count)
        if (pageProps.curatedHighlights) {
          let totalSnaps = 0;
          let hasSnapList = false;
          pageProps.curatedHighlights.forEach((hl) => {
            if (hl.snapList) {
              totalSnaps += hl.snapList.length;
              hasSnapList = true;
            }
          });
          highlights = hasSnapList ? totalSnaps : (publicProfileInfo?.hasCuratedHighlights ? 0 : null);
        }
        
        // Calculate spotlight highlights count (videos count)
        if (pageProps.spotlightHighlights) {
          let totalSnaps = 0;
          let hasSnapList = false;
          pageProps.spotlightHighlights.forEach((hl) => {
            if (hl.snapList) {
              totalSnaps += hl.snapList.length;
              hasSnapList = true;
            }
          });
          spotlights = hasSnapList ? totalSnaps : (publicProfileInfo?.hasSpotlightHighlights ? 0 : null);
        }
        
        // Calculate total views from spotlightStoryMetadata
        if (pageProps.spotlightStoryMetadata) {
          let total = 0;
          pageProps.spotlightStoryMetadata.forEach((story) => {
            const vc = Number(story.engagementStats?.viewCount || story.videoMetadata?.viewCount || 0);
            if (!isNaN(vc)) {
              total += vc;
            }
          });
          totalViews = total;
        }
      }
    }
  } catch (err) {
    console.warn(`Next.js parsing failed:`, err.message);
  }

  // Fallbacks if Next.js didn't give subscribers
  if (subscribers === null) {
    // Try JSON-LD
    try {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonData = JSON.parse($(el).html() || "{}");
          if (jsonData.interactionStatistic) {
            jsonData.interactionStatistic.forEach((stat) => {
              if (stat["@type"] === "InteractionCounter") {
                if (stat.interactionType?.includes("Follow") && subscribers === null) {
                  subscribers = stat.userInteractionCount || 0;
                  methodUsed = "JSON-LD";
                }
                if (stat.interactionType?.includes("ViewAction") && totalViews === null) {
                  totalViews = stat.userInteractionCount || 0;
                }
                if (stat.interactionType?.includes("PublishAction") && stories === null) {
                  stories = stat.userInteractionCount || 0;
                }
              }
            });
          }
        } catch {}
      });
    } catch {}
  }

  if (subscribers === null) {
    const pageText = $.text();
    const subscribersMatch = pageText.match(/(\d+(?:[,.]\d+)*(?:[KMB])?)\s*(?:Subscriber|Follower|subscriber|follower)/i);
    if (subscribersMatch) {
      subscribers = parseNumber(subscribersMatch[1]);
      methodUsed = "Regex";
    }
  }

  return {
    displayName,
    avatar,
    bio,
    snapcode,
    subscribers,
    stories,
    highlights,
    spotlights,
    totalViews,
    methodUsed
  };
}

async function run() {
  const username = process.argv[2] || 'wwe';
  const html = await fetchProfile(username);
  if (!html) return;
  const result = scrapeProfile(html, username);
  console.log("Scraped Result:", JSON.stringify(result, null, 2));
}

run();
