"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderToPng = renderToPng;
const playwright_1 = require("playwright");
async function renderToPng(html, css) {
    const browser = await playwright_1.chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
    });
    const doc = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<style>
html, body { margin:0; padding:0; }
${css}
</style>
</head>
<body>
${html}
</body>
</html>
`;
    await page.setContent(doc, { waitUntil: "networkidle" });
    const png = await page.screenshot({ fullPage: true });
    await browser.close();
    return png;
}
