// src/routes/authRoutes.ts

import { Router } from 'express';
import  AuthController  from '../controller/AuthController';

const routerRegister = Router();

routerRegister.post('/', AuthController.register);

export default routerRegister;