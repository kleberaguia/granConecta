"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cardsInfoGridModels_1 = __importDefault(require("../models/cardsInfoGridModels"));
const getAllCard = async (req, res) => {
    const listaSecao = await cardsInfoGridModels_1.default.getAllCads();
    return listaSecao;
};
const getByIdcard = async (req, res) => {
    const Secao = await cardsInfoGridModels_1.default.getByIdCards(Number(req.params.id));
    return Secao;
};
const newCard = async (req, res) => {
    const newSecao = await cardsInfoGridModels_1.default.newCard(req.body);
    return newSecao;
};
const editPartialCard = async (req, res) => {
    const listaSecao = await cardsInfoGridModels_1.default.editPartialCard(Number(req.params.id), req.body);
    return listaSecao;
};
const removerCad = async (req, res) => {
    const remover = await cardsInfoGridModels_1.default.removerCard(Number(req.params.id));
    return remover;
};
exports.default = {
    getAllCard,
    getByIdcard,
    newCard,
    editPartialCard,
    removerCad
};
