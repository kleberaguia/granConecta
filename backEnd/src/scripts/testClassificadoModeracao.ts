import classificadoModeracaoService
  from "../services/classificados/ClassificadoModeracaoService";

function testar(
  nome: string,
  titulo: string,
  descricao: string,
  quantidadeAnunciosRecentes = 0
) {
  const resultado =
    classificadoModeracaoService.analisar({
      titulo,
      descricao,
      quantidadeAnunciosRecentes,
    });

  console.log(
    "\n======================================"
  );

  console.log(nome);

  console.log(
    "======================================"
  );

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}

/**
 * ============================================================
 * TESTE 1
 * VENDA PESSOAL
 * ============================================================
 */

testar(
  "TESTE 1 - NOTEBOOK PESSOAL",

  "Notebook Dell Inspiron",

  "Estou vendendo meu notebook usado porque comprei outro. Está funcionando perfeitamente e acompanha carregador."
);

/**
 * ============================================================
 * TESTE 2
 * VENDA PESSOAL COM WHATSAPP
 * ============================================================
 *
 * Importante:
 *
 * Informar WhatsApp sozinho não deve transformar
 * automaticamente uma venda pessoal em comércio.
 */

testar(
  "TESTE 2 - NOTEBOOK + WHATSAPP",

  "Notebook Dell Inspiron",

  "Estou vendendo meu notebook usado porque comprei outro. Interessados podem falar comigo no WhatsApp 11 99999-8888."
);

/**
 * ============================================================
 * TESTE 3
 * ATIVIDADE COMERCIAL
 * ============================================================
 */

testar(
  "TESTE 3 - SALGADOS",

  "Salgados para festas",

  "Vendo salgados para festas. Aceito encomendas. Faça seu pedido pelo WhatsApp 11 99999-8888."
);

/**
 * ============================================================
 * TESTE 4
 * PRESTAÇÃO DE SERVIÇO
 * ============================================================
 */

testar(
  "TESTE 4 - ELETRICISTA",

  "Eletricista residencial",

  "Faço instalação e manutenção elétrica. Orçamento sem compromisso. Chame no WhatsApp 11 99999-8888."
);

/**
 * ============================================================
 * TESTE 5
 * RECORRÊNCIA SEM COMÉRCIO
 * ============================================================
 *
 * Mesmo com anúncios anteriores, uma venda claramente
 * pessoal não deve ser bloqueada somente pela quantidade.
 */

testar(
  "TESTE 5 - BICICLETA / RECORRÊNCIA",

  "Bicicleta usada",

  "Estou vendendo minha bicicleta porque não estou mais utilizando.",

  2
);

/**
 * ============================================================
 * TESTE 6
 * COMÉRCIO RECORRENTE
 * ============================================================
 */

testar(
  "TESTE 6 - DOCES / RECORRÊNCIA",

  "Doces e brigadeiros",

  "Vendo brigadeiros e doces. Aceito encomendas e pedidos pelo WhatsApp 11 99999-8888.",

  3
);