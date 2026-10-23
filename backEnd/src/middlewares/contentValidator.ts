import { Request, Response, NextFunction } from 'express';
import { containsBadWords } from '../utils/wordFilter';

export const validateContent = (req: Request, res: Response, next: NextFunction) => {
  const { nome_profissional, descricao_bio, servicos_oferecidos } = req.body;

  // Verifica todos os campos de texto sensíveis
  const fieldsToVerify = [nome_profissional, descricao_bio, servicos_oferecidos];
  
  const hasInappropriateContent = fieldsToVerify.some(field => containsBadWords(field));

  if (hasInappropriateContent) {
    return res.status(400).json({ 
      error: "O conteúdo contém palavras não permitidas pela política da plataforma." 
    });
  }

  next();
};