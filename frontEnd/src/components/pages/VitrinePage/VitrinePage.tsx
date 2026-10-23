import React, { useState, useEffect } from 'react';
import { type IProdutoVitrine } from '../../../interfaces/types';
import style from './VitrinePage.module.css';
import ProdutoCard from '../../ProdutoCard/ProdutoCard';
const url = import.meta.env.VITE_API_URL;
const API_URL =  `${url}/api/produtos/vitrine`;

const VitrinePage: React.FC = () => {
  const [produtos, setProdutos] = useState<IProdutoVitrine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL);
        console.log(response)
        if (!response.ok) {
          throw new Error(`Erro ao buscar produtos. Status: ${response.status}`);
        }

        const data: IProdutoVitrine[] = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Resposta inesperada do servidor. Esperado um array de produtos.");
        }

        setProdutos(data);
      } catch (err) {
        console.error("Erro ao buscar produtos da vitrine:", err);
        setError(`Não foi possível carregar a vitrine. Detalhe: ${err instanceof Error ? err.message : 'Erro desconhecido.'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  if (error) {
    return (
      <div className={style.vitrinePage}>
        <div className={style.pageHeader}>
          <h1>Erro de Carregamento</h1>
          <p>Ocorreu um problema ao tentar carregar a vitrine.</p>
        </div>
        <div style={{ textAlign: 'center', color: 'red', padding: '20px', border: '1px solid red', borderRadius: '8px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={style.vitrinePage}>
        <header className={style.pageHeader}>
          <h1>Vitrine de Objetos Sagrados</h1>
          <p>Itens de fé disponíveis em nossa secretaria paroquial.</p>
        </header>
        <p style={{ textAlign: 'center' }}>Carregando produtos...</p>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className={style.vitrinePage}>
        <header className={style.pageHeader}>
          <h1>Vitrine de Objetos Sagrados</h1>
          <p>Itens de fé disponíveis em nossa secretaria paroquial.</p>
        </header>
        <p style={{ textAlign: 'center' }}>Nenhum item está disponível na vitrine no momento.</p>
      </div>
    );
  }

  return (
    <div className={style.vitrinePage}>
      <header className={style.pageHeader}>
        <h1>Vitrine de Objetos Sagrados</h1>
        <p>Itens de fé disponíveis em nossa secretaria paroquial.</p>
      </header>
      <div className={style.productGrid}>
        {produtos.map(produto => (
          <ProdutoCard key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  );
};

export default VitrinePage;