import express from 'express'
import secaoController from '../controller/secaoController'

export const routerSecao =  express.Router()

routerSecao.get('/', secaoController.getHome)
routerSecao.post('/', secaoController.createSecao)
routerSecao.put('/:id', secaoController.updateSecao)
routerSecao.delete('/:id', secaoController.deleteSecao)
