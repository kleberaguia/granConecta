function isInsideTag(attrs: string, key: string) {
  const re = new RegExp(`\\b${key}\\s*=\\s*["'][^"']*["']`, "i");
  return re.test(attrs || "");
}

let counter = 0;
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${counter}`;
}

export function instrumentHtmlForEditor(html: string) {
  counter = 0;
  let out = String(html || "");

  // Textos editáveis
  out = out.replace(
    /<(h1|h2|h3|h4|h5|h6|p|span|a|button|li|label|small|strong|em)(\s[^>]*)?>/gi,
    (match, tag, attrs) => {
      const a = String(attrs || "");
      const hasData = /data-edit\s*=\s*["']text["']/i.test(a);
      const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(a);
      const addId = hasId ? "" : ` id="${nextId("el")}"`;
      const addData = hasData ? "" : ` data-edit="text"`;
      return `<${tag}${a}${addId}${addData}>`;
    }
  );

  // Imagens editáveis
  out = out.replace(/<img(\s[^>]*)?>/gi, (match, attrs) => {
    const a = String(attrs || "");
    const hasData = /data-edit\s*=\s*["']image["']/i.test(a);
    const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(a);
    const addId = hasId ? "" : ` id="${nextId("img")}"`;
    const addData = hasData ? "" : ` data-edit="image"`;
    return `<img${a}${addId}${addData}>`;
  });

  // Background editável (se tiver background-image no style)
  out = out.replace(
    /<([a-z0-9]+)([^>]*?)\sstyle\s*=\s*["']([^"']*)["']([^>]*)>/gi,
    (full, tag, before, style, after) => {
      const hasBg = /background-image\s*:\s*url\(|background\s*:\s*url\(/i.test(style);
      if (!hasBg) return full;

      const attrsAll = `${before} style="${style}"${after}`;
      const hasData = /data-edit\s*=\s*["']bg["']/i.test(attrsAll);
      const hasId = /\sid\s*=\s*["'][^"']+["']/i.test(attrsAll);

      const addId = hasId ? "" : ` id="${nextId("bg")}"`;
      const addData = hasData ? "" : ` data-edit="bg"`;

      return `<${tag}${before}${addId}${addData} style="${style}"${after}>`;
    }
  );

  return out;
}