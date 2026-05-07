import { Request, Response } from "express";
import cardsInfoGridModel from "../models/cardsInfoGridModels";

const getAllCard = async (req: Request, res: Response) => {
    const listaSecao = await cardsInfoGridModel.getAllCads()
    return listaSecao
}
const getByIdcard = async (req: Request, res: Response) => {
    const Secao = await cardsInfoGridModel.getByIdCards(Number(req.params.id))
    return Secao
}
const newCard = async (req: Request, res: Response) => {

    const newSecao = await cardsInfoGridModel.newCard(req.body)
    return newSecao
}
const editPartialCard = async (req: Request, res: Response) => {

    const listaSecao = await cardsInfoGridModel.editPartialCard(Number(req.params.id), req.body)
    return listaSecao
}

const removerCad = async (req: Request, res: Response) => {
    const remover = await cardsInfoGridModel.removerCard(Number(req.params.id))
    return remover
}


export default {
    getAllCard,
    getByIdcard,
    newCard,
    editPartialCard,
    removerCad

}