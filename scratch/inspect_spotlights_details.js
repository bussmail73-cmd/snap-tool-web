import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch_next_data.json', 'utf8'));
const pp = data.props.pageProps;

if (pp.taggedTabResponse) {
  const tr = pp.taggedTabResponse;
  
  if (tr.searchResponse && tr.searchResponse.searchHits) {
    console.log("=== searchHits count ===", tr.searchResponse.searchHits.length);
    if (tr.searchResponse.searchHits.length > 0) {
      const hit = tr.searchResponse.searchHits[0];
      console.log("searchHit 0 keys:", Object.keys(hit));
      console.log("searchHit 0 details:", JSON.stringify(hit, null, 2).substring(0, 800));
    }
  }
  
  if (tr.spotlightCardMap) {
    console.log("=== spotlightCardMap count ===", Object.keys(tr.spotlightCardMap).length);
    const keys = Object.keys(tr.spotlightCardMap);
    if (keys.length > 0) {
      console.log("spotlightCardMap key 0 details:", JSON.stringify(tr.spotlightCardMap[keys[0]], null, 2).substring(0, 1000));
    }
  }
} else {
  console.log("No taggedTabResponse in pp");
}
