"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackendRootDir = getBackendRootDir;
exports.getTemplatesDir = getTemplatesDir;
exports.getLayoutsDir = getLayoutsDir;
exports.getThemesDir = getThemesDir;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
function existsDir(p) {
    try {
        return node_fs_1.default.existsSync(p) && node_fs_1.default.statSync(p).isDirectory();
    }
    catch {
        return false;
    }
}
/** Retorna SEMPRE string */
function getBackendRootDir() {
    // __dirname aqui deve estar em dist/... em prod, então suba até achar package.json
    const candidates = [
        process.cwd(),
        node_path_1.default.resolve(process.cwd(), ".."),
        node_path_1.default.resolve(__dirname, "..", ".."), // src/* -> backEnd em dev
        node_path_1.default.resolve(__dirname, "..", "..", ".."),
    ];
    for (const base of candidates) {
        // heurística boa: existir src/ OU package.json OU templates/
        if (existsDir(node_path_1.default.join(base, "src")) ||
            node_fs_1.default.existsSync(node_path_1.default.join(base, "package.json")) ||
            existsDir(node_path_1.default.join(base, "templates"))) {
            return base;
        }
    }
    return process.cwd(); // fallback garantido
}
function getTemplatesDir() {
    const root = getBackendRootDir();
    const dir = node_path_1.default.join(root, "templates");
    if (existsDir(dir))
        return dir;
    throw new Error(`templates/ não encontrado em: ${dir}`);
}
function getLayoutsDir() {
    return node_path_1.default.join(getBackendRootDir(), "layouts");
}
function getThemesDir() {
    return node_path_1.default.join(getBackendRootDir(), "themes");
}
