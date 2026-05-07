import fs from "node:fs";
import path from "node:path";

function existsDir(p: string) {
  try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); } catch { return false; }
}

/** Retorna SEMPRE string */
export function getBackendRootDir(): string {
  // __dirname aqui deve estar em dist/... em prod, então suba até achar package.json
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(__dirname, "..", ".."),   // src/* -> backEnd em dev
    path.resolve(__dirname, "..", "..", ".."),
  ];

  for (const base of candidates) {
    // heurística boa: existir src/ OU package.json OU templates/
    if (
      existsDir(path.join(base, "src")) ||
      fs.existsSync(path.join(base, "package.json")) ||
      existsDir(path.join(base, "templates"))
    ) {
      return base;
    }
  }

  return process.cwd(); // fallback garantido
}

export function getTemplatesDir(): string {
  const root = getBackendRootDir();
  const dir = path.join(root, "templates");
  if (existsDir(dir)) return dir;
  throw new Error(`templates/ não encontrado em: ${dir}`);
}

export function getLayoutsDir(): string {
  return path.join(getBackendRootDir(), "layouts");
}

export function getThemesDir(): string {
  return path.join(getBackendRootDir(), "themes");
}