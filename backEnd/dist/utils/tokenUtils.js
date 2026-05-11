"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.hashToken = hashToken;
exports.compareToken = compareToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
function signAccessToken(payload) {
    const options = {
        expiresIn: '30d',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
}
function signRefreshToken(payload) {
    const options = {
        expiresIn: '30d',
    };
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, options);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
}
async function hashPassword(senha) {
    return await bcryptjs_1.default.hash(senha, 10);
}
async function comparePassword(senha, hash) {
    return await bcryptjs_1.default.compare(senha, hash);
}
async function hashToken(token) {
    return await bcryptjs_1.default.hash(token, 10);
}
async function compareToken(token, hash) {
    if (!hash)
        return false;
    return await bcryptjs_1.default.compare(token, hash);
}
