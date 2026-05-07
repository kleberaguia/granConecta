import * as dotenv from 'dotenv';
import path from 'path';

const ENV = process.env.NODE_ENV || 'development';

const envMap: Record<string, string> = {
 local: '.env.local',
 development: '.env.dev',
 production: '.env.production',
};

const envFile = envMap[ENV] || '.env';

dotenv.config({
 path: path.resolve(process.cwd(), envFile),
 override: true,
});

console.log(`🌍 Ambiente: ${ENV}`);
console.log(`📄 Arquivo carregado: ${envFile}`);

import 'reflect-metadata';
import express from 'express';
import http from 'http';
import cors from 'cors';

// Imports internos
import { app } from './app';
import { AppDataSource } from './config/data-source';
import { initSocket } from './socket/socket';

const PORT = Number(process.env.PORT ?? 3000);

// (se você precisa desses paths, mantenha como estava)
const uploadsPath = path.join(process.cwd(), 'uploads');
const landingPagesPath = path.join(process.cwd(), 'src', 'confi...'); // mantenha seu resto

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

async function bootstrap() {
//  console.log('🔌 Iniciando TypeORM initialize()...');
//  console.log('ℹ️ DB_HOST:', process.env.DB_HOST);
//  console.log('ℹ️ DB_PORT:', process.env.DB_PORT);
//  console.log('ℹ️ DB_USER:', process.env.DB_USER);
//  console.log('ℹ️ DB_DATABASE:', process.env.DB_DATABASE);

 await AppDataSource.initialize();
 console.log('✅ TypeORM inicializado. isInitialized =', AppDataSource.isInitialized);

//  console.log('🧩 Rodando synchronize()...');
//  await AppDataSource.synchronize();
//  console.log('✅ synchronize() concluído.');

 const server = http.createServer(app);

 // Socket
 initSocket(server);

 server.listen(PORT, () => {
 console.log(`🚀 Servidor rodando na porta ${PORT}`);
 });
}

bootstrap().catch((err) => {
 console.error('❌ Erro fatal ao subir servidor:', err);
 process.exit(1);
});