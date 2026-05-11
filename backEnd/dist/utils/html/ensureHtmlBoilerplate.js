"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureHtmlBoilerplate = ensureHtmlBoilerplate;
function ensureHtmlBoilerplate(raw) {
    let s = String(raw || "").trim();
    s = s.replace(/```html/gi, "").replace(/```/g, "").trim();
    const matchDoctype = s.match(/<!doctype html[\s\S]*<\/html>/i);
    if (matchDoctype)
        return matchDoctype[0];
    const matchHtml = s.match(/<html[\s\S]*<\/html>/i);
    if (matchHtml)
        return "<!doctype html>\n" + matchHtml[0];
    // fallback: envolve
    return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Landing</title>
  <style>body{font-family:system-ui,Segoe UI,Roboto,Arial;}</style>
</head>
<body>${s}</body>
</html>`;
}
