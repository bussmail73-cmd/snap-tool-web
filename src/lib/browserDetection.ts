/**
 * Browser detection utility
 * Ensures the application only runs in Chrome
 */

export function isChrome(): boolean {
  const userAgent = navigator.userAgent;
  // Check for Chrome but exclude Edge and Opera which also contain "Chrome"
  return (
    /Chrome/.test(userAgent) &&
    /Google Inc/.test(navigator.vendor) &&
    !/Edge|Edg|OPR/.test(userAgent)
  );
}

export function getBrowserName(): string {
  const userAgent = navigator.userAgent;

  if (/Edge|Edg/.test(userAgent)) return "Edge";
  if (/OPR/.test(userAgent)) return "Opera";
  if (/Chrome/.test(userAgent)) return "Chrome";
  if (/Safari/.test(userAgent)) return "Safari";
  if (/Firefox/.test(userAgent)) return "Firefox";
  if (/MSIE|Trident/.test(userAgent)) return "Internet Explorer";

  return "Unknown";
}

export function renderChromeOnlyMessage(): void {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Chrome Required - Getinbex</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          max-width: 500px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 16px;
          font-size: 28px;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 16px;
          font-size: 16px;
        }
        .browser-name {
          background: #f0f0f0;
          padding: 12px;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: 600;
          color: #333;
        }
        .chrome-logo {
          width: 80px;
          height: 80px;
          margin: 20px auto;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.3s;
        }
        .button:hover {
          background: #5568d3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <svg class="chrome-logo" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
          <circle cx="96" cy="96" r="90" fill="#f3f3f3"/>
          <path d="M96 16c-44.2 0-80 35.8-80 80s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80zm-40 80c0-22.1 17.9-40 40-40s40 17.9 40 40-17.9 40-40 40-40-17.9-40-40z" fill="#4285f4"/>
          <path d="M96 56c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40z" fill="#ea4335"/>
          <path d="M96 56c-22.1 0-40 17.9-40 40h80c0-22.1-17.9-40-40-40z" fill="#fbbc04"/>
          <path d="M96 96v40c22.1 0 40-17.9 40-40h-40z" fill="#34a853"/>
        </svg>
        <h1>Chrome Required</h1>
        <p>This website is optimized to run exclusively on Google Chrome.</p>
        <div class="browser-name">You are using: ${getBrowserName()}</div>
        <p>For the best experience, please download and use Google Chrome.</p>
        <a href="https://www.google.com/chrome/" class="button" target="_blank">Download Chrome</a>
      </div>
    </body>
    </html>
  `;

  document.documentElement.innerHTML = html;
}
