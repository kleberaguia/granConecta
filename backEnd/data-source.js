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
exports.AppDataSource = void 0;
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const NODE_ENV = process.env.NODE_ENV ?? 'local';
const isCompiled = __dirname.includes('dist');
const ENV_MAP = {
    local: '.env.local',
    development: '.env.dev',
    production: '.env.production'
};
const envFile = ENV_MAP[NODE_ENV] || '.env.local';
dotenv.config({
    path: path_1.default.resolve(process.cwd(), envFile),
});
const env = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`Missing env: ${key}`);
    return value.replace(/\r/g, '').trim();
};
const migrationsPath = isCompiled
    ? path_1.default.resolve(__dirname, '../migrations/*.js')
    : path_1.default.resolve(__dirname, '../migrations/*.ts');
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: env('DB_HOST'),
    port: Number(env('DB_PORT')),
    username: env('DB_USER'),
    password: env('DB_PASSWORD'),
    database: env('DB_DATABASE'),
    synchronize: true,
    logging: ['error'],
    entities: [
        isCompiled
            ? path_1.default.resolve(__dirname, '../models/*.{js}')
            : path_1.default.resolve(__dirname, '../models/*.{ts}')
    ],
    migrations: [
        path_1.default.resolve(__dirname, '../migrations/*.js')
    ]
});
