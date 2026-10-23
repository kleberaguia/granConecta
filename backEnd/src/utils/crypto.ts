import crypto from 'crypto';
import {config} from 'dotenv'
const ALGORITHM = 'aes-256-cbc';

config()
// A ENCRYPTION_KEY deve ter 32 caracteres e estar no seu .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sua-chave-mestra-de-32-caracteres'; 
const IV_LENGTH = 16; // Tamanho do vetor de inicialização

export function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}