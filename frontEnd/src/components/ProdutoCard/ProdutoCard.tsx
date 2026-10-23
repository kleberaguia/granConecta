import React from 'react';
import type { IProdutoVitrine } from '../../interfaces/types';
import style from '../pages/VitrinePage/VitrinePage.module.css';
import { API_URL } from "../../utils/config";
interface ProdutoCardProps {
  produto: IProdutoVitrine;
}
const formatPrice = (price: number | null) => {
  if (price === null) {
    return (
      <span className={style.cardPriceSobConsulta}>
        Sob consulta
      </span>
    );
  }
  return (
    <span className={style.cardPrice}>
      {price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}
    </span>
  );
};
const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto }) => {
  return (
    <div className={style.productCard}>
      {!produto.status && (
        <>
          <div className={style.cardOverlay} />
          <div className={style.cardOverlayText}>Indisponível</div>
        </>
      )}

      <div className={style.cardImageContainer}>
        <img src={`${API_URL}${produto.imagemUrl}`} alt={produto.name} />
      </div>
      <div className={style.cardBody}>
        <h3 className={style.cardTitle}>{produto.name}</h3>
        <p className={style.cardDescription}>{produto.description}</p>        
        {formatPrice(produto.price)}
        {produto.status ? (
          <a
            href={produto.link_contato ?? '#'}
            className={style.cardCtaButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tenho Interesse
          </a>
        ) : (
          <button
            className={style.cardCtaButton}
            disabled
          >
            Indisponível
          </button>
        )}
      </div> 
    </div> 
  );
};

export default ProdutoCard;