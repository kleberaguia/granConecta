import express from 'express'
import cardController from '../controller/cardController'

export const routerCads = express.Router()

routerCads.get('/', cardController.getAllCard)
routerCads.get('/:id', cardController.getByIdcard)
routerCads.post('/', cardController.newCard)
routerCads.patch('/:id', cardController.editPartialCard)
routerCads.delete('/:id', cardController.removerCad)