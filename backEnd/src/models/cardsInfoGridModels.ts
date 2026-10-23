import { ICards } from "../interfaces/types";
import { connectionModel } from "./connectionModels";

const getAllCads = async () => {
    const [listaCards] = await connectionModel.execute('SELECT * FROM card')
    return listaCards
}
const getByIdCards = async (id: number) => {
    const [card] = await connectionModel.execute(`SELECT * FROM card where id=${id}`)
    return card
}
const newCard = async (body: ICards) => {
    const {secao_id,ordem,icone,titulo,conteudo,link_botao,texto_botao} = body
    const query = 'INSERT INTO card (secao_id,ordem,icone,titulo,conteudo,link_botao,texto_botao) values(?,?,?,?,?,?,?)'
    const [newSecao] = await connectionModel.execute(query, [secao_id,ordem,icone,titulo,conteudo,link_botao,texto_botao])
    return newSecao
}
const editPartialCard = async (id: number, update: Partial<ICards>) => {

    //pegar o campo
    const fields = Object.keys(update)
    //pegar o valor do campo
    const value = Object.values(update)

    //monta dinamicamente a clausula     
    const setClause = fields.map(file => `${file} =?`).join(', ')
    const edit = await connectionModel.execute(setClause,)
    const [listaSecao] = await connectionModel.execute('SELECT * FROM card')
    return listaSecao
}

const removerCard = async (id: number) => {
    const query = 'DELETE FROM card WHERE id=?'
    const [remover] = await connectionModel.execute(query, [id])
    return remover
}


export default {
    getAllCads,
    getByIdCards,
    newCard,
    editPartialCard,
    removerCard

}