"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ENV = process.env.NODE_ENV || 'development';
const envMap = {
    local: '.env.local',
    development: '.env.dev',
    production: '.env.production',
};
const envFile = envMap[ENV] || '.env';
dotenv.config({
    path: path_1.default.resolve(process.cwd(), envFile),
    override: true,
});
console.log(`🌍 Ambiente: ${ENV}`);
console.log(`📄 Arquivo carregado: ${envFile}`);
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
// Imports internos
const app_1 = require("./app");
const data_source_1 = require("./config/data-source");
const socket_1 = require("./socket/socket");
const PORT = Number(process.env.PORT ?? 3000);
// (se você precisa desses paths, mantenha como estava)
const uploadsPath = path_1.default.join(process.cwd(), 'uploads');
const landingPagesPath = path_1.default.join(process.cwd(), 'src', 'confi...'); // mantenha seu resto
app_1.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
async function bootstrap() {
    //  console.log('🔌 Iniciando TypeORM initialize()...');
    //  console.log('ℹ️ DB_HOST:', process.env.DB_HOST);
    //  console.log('ℹ️ DB_PORT:', process.env.DB_PORT);
    //  console.log('ℹ️ DB_USER:', process.env.DB_USER);
    //  console.log('ℹ️ DB_DATABASE:', process.env.DB_DATABASE);
    await data_source_1.AppDataSource.initialize();
    console.log('✅ TypeORM inicializado. isInitialized =', data_source_1.AppDataSource.isInitialized);
    //  console.log('🧩 Rodando synchronize()...');
    //  await AppDataSource.synchronize();
    //  console.log('✅ synchronize() concluído.');
    const server = http_1.default.createServer(app_1.app);
    // Socket
    (0, socket_1.initSocket)(server);
    server.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
}
bootstrap().catch((err) => {
    console.error('❌ Erro fatal ao subir servidor:', err);
    process.exit(1);
});
