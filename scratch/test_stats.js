import axios from 'axios';

async function test() {
  const url = "http://127.0.0.1:3000/api/admin/stats";

  try {
    console.log("Sending GET request to /api/admin/stats...");
    const start = Date.now();
    const res = await axios.get(url, { timeout: 8000 });
    const end = Date.now();
    
    console.log(`\n=== API SUCCESS IN ${end - start}ms ===`);
    console.log("Status:", res.status);
    console.log("Response Body (Truncated keys):");
    const data = res.data;
    console.log({
      uptime: data.uptime,
      memory: data.memory,
      cpu: data.cpu,
      activeTasks: data.activeTasks,
      reachability: data.reachability,
      tools: data.tools?.slice(0, 2),
      dependenciesCount: data.dependencies?.length,
      seoScore: data.seo?.score,
      seoDetailsCount: data.seo?.details?.length
    });
  } catch (err) {
    console.error("API Request Failed:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
  }
}

test();
