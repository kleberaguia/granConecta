"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connectionModels_1 = require("./connectionModels");
const getAllCads = async () => {
    const [listaCards] = await connectionModels_1.connectionModel.execute('SELECT * FROM card');
    return listaCards;
};
const getByIdCards = async (id) => {
    const [card] = await connectionModels_1.connectionModel.execute(`SELECT * FROM card where id=${id}`);
    return card;
};
const newCard = async (body) => {
    const { secao_id, ordem, icone, titulo, conteudo, link_botao, texto_botao } = body;
    const query = 'INSERT INTO card (secao_id,ordem,icone,titulo,conteudo,link_botao,texto_botao) values(?,?,?,?,?,?,?)';
    const [newSecao] = await connectionModels_1.connectionModel.execute(query, [secao_id, ordem, icone, titulo, conteudo, link_botao, texto_botao]);
    return newSecao;
};
const editPartialCard = async (id, update) => {
    //pegar o campo
    const fields = Object.keys(update);
    //pegar o valor do campo
    const value = Object.values(update);
    //monta dinamicamente a clausula     
    const setClause = fields.map(file => `${file} =?`).join(', ');
    const edit = await connectionModels_1.connectionModel.execute(setClause);
    const [listaSecao] = await connectionModels_1.connectionModel.execute('SELECT * FROM card');
    return listaSecao;
};
const removerCard = async (id) => {
    const query = 'DELETE FROM card WHERE id=?';
    const [remover] = await connectionModels_1.connectionModel.execute(query, [id]);
    return remover;
};
exports.default = {
    getAllCads,
    getByIdCards,
    newCard,
    editPartialCard,
    removerCard
};
