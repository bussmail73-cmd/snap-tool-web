---
title: Snap Tool Web
emoji: 📸
colorFrom: yellow
colorTo: orange
sdk: docker
app_port: 7860
pinned: false
---

# ⚡ SnapBlast - Ultimate Snapchat Media & Profile Suite

<div align="center">
  <img alt="SnapBlast Header" src="./snapchat.png" width="200px" style="border-radius: 24px; margin-bottom: 20px;" />
  <p><strong>An ultra-fast, robust, and premium web application to view profiles, download high-definition profile pictures, and bulk download stories, spotlights, and highlights from Snapchat.</strong></p>

  [![Node.js Version](https://img.shields.io/badge/Node.js-v18.x+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
  [![Vite](https://img.shields.io/badge/Vite-v6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.config.ts)
  [![React](https://img.shields.io/badge/React-v19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![Express](https://img.shields.io/badge/Express-v4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-v5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
</div>

---

## ✨ Features

SnapBlast packs a comprehensive suite of tools built on a single, high-performance web interface designed with premium dark slate aesthetics, fluid micro-animations, and full mobile responsiveness:

*   📥 **Snapchat Bulk Video Downloader:** Extract and download all public stories, spotlight videos, and highlights in bulk from any public Snapchat profile in seconds.
*   ⚡ **Spotlight Downloader:** Instantly download individual Snapchat Spotlight videos directly by entering the share link.
*   🖼️ **High-Definition DP Downloader:** Extract and download full-resolution high-definition profile pictures (avatars) from any username.
*   🔍 **Snapchat Profile Viewer:** Seamlessly inspect public profile details, display names, subscriber metrics, biography, active story counts, and metadata.
*   📊 **Developer Analytics Dashboard:** Built-in real-time stats tracker accessible at `/dashboard` (secured with passcode `1423`) to monitor live CPU/Memory utilization, scraping latency graphs, cache hit ratios, and real-time backend scrap logs.

---

## 🚀 Under the Hood & System Architecture

SnapBlast is architected to prioritize stability, connection speed, and bypass modern network routing constraints:

1.  **Dual-Stack DNS Optimization:** Uses global IPv4 pre-routing (`ipv4first`) inside Node.js to resolve connection failures (`ENOTFOUND`) on Windows servers behind dual-stack routers.
2.  **Robust Username Parsing:** Leverages optimized regular expressions natively supporting special characters, underscores (`_`), dots (`.`), and hyphens (`-`) across all Snapchat profiles.
3.  **Adaptive Scraper Engine:** Uses a hybrid scraping layer. It queries Snapchat's NextJS server-side payloads via structured parsing and falls back to advanced scraper scripts (Cheerio & Axios Keep-Alive Agents) to guarantee consistent results.
4.  **Ultra-Fast Caching:** Employs an in-memory `LRUCache` (Least Recently Used Cache) on the server. Subsequent requests load instantly in **3ms to 5ms** without hitting Snapchat servers, saving network bandwidth.
5.  **Single-Server Integration:** Vite is fully integrated as a middleware within the Express server. Running a single command hosts both the frontend interface and backend API routes simultaneously on the same port!

---

## 🛠️ Step-by-Step Installation Guide

Setting up SnapBlast locally is simple. Follow these easy steps:

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or higher) installed on your system. You can check your version by running:
```bash
node -v
```

### 2. Clone the Repository
Clone this repository to your local machine using Git:
```bash
git clone https://github.com/bussmail73-cmd/snap-tool-web.git
```
Then navigate into the project directory:
```bash
cd snap-tool-web
```

### 3. Install Dependencies
Install all the required frontend and backend packages specified in `package.json`:
```bash
npm install
```

### 4. Configure Environment Variables (Optional)
Copy the example environment file to create your own configuration:
```bash
cp .env.example .env
```
*(You can customize the server ports or caching limits inside this `.env` file if desired)*.

---

## 🚦 How to Run the Application

You only need **one command** to boot up the entire website and API!

### Run in Development Mode
To start the application with Hot Module Replacement (HMR) and real-time logging, run:
```bash
npm run dev
```
Once the command starts, open your browser and navigate to:
🌐 **`http://localhost:3000`**

### Run in Production Mode
For high-traffic, production deployments, compile the optimized React bundle first:
```bash
npm run build
```
Then start the high-performance Express production server:
```bash
npm run start
```

---

## 📊 Developer & Admin Dashboard

SnapBlast features a secure built-in analytics dashboard to monitor your web app's live health:

1.  Navigate to **`http://localhost:3000/dashboard`** in your browser.
2.  Enter the secure passcode: **`1423`**
3.  **Features available in the dashboard:**
    *   📈 Live CPU Delta tracker & RAM usage stats.
    *   ⏱️ Request latency history (average response times in milliseconds).
    *   🔄 Cache bypass switches to force real-time server scraping.
    *   ⚙️ Scraper Timeout controls to adjust response limits dynamically.
    *   📝 Live Activity Logs showing usernames, scraping types, latencies, and statuses.

---

## 🛡️ License & Disclaimer

*   **License:** Distributed under the MIT License. See `LICENSE` for more information.
*   **Disclaimer:** This utility is created for educational and personal use only. Users are responsible for complying with Snapchat's Terms of Service and respecting content creators' copyrights.

---

<div align="center">
  <p>Made with ❤️ for high-performance media downloading.</p>
</div>
