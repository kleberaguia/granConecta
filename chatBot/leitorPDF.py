import os
import sys
import re
import numpy as np
from typing import List, Dict
from PyPDF2 import PdfReader
from rank_bm25 import BM25Okapi

# --- CONFIGURAÇÕES ---
# Regex para detectar parágrafos numerados (ex: "1629. ...")
# Útil para Catecismo e Código Canônico
PARAGRAFO_REGEX = re.compile(r'^(\d{3,4})[\.\)]\s*(.*)$')

# Palavras comuns que não dão sentido à frase (Stopwords)
STOPWORDS_PT = {
    "a", "as", "o", "os", "de", "da", "do", "das", "dos", "em", "no", "na", 
    "nos", "nas", "por", "para", "com", "um", "uma", "uns", "umas", "que", 
    "qual", "quais", "quem", "como", "onde", "porque", "porquê", "e", "ou", 
    "mas", "se", "são", "é", "foi", "ser", "estar", "tem", "ter"
}

# Dicionário de sinônimos
SINONIMOS = {
    "heresia": ["heresia", "herege", "hereges"],
    "apostasia": ["apostasia", "apóstata"],
    "idolatria": ["idolatria", "ídolos", "idólatra"],
    "blasfemia": ["blasfemia", "blasfêmia"],
    "matrimonio": ["matrimônio", "casamento", "núpcias"],
    "divorcio": ["divórcio", "separação"],
    "comunhao": ["comunhão", "eucaristia", "hóstia"],
    "confissao": ["confissão", "penitência", "reconciliação"],
    "nulidade": ["nulidade", "nulo", "anulação"],
}

def carregar_todos_pdfs(pasta: str = ".") -> List[Dict]:
    """
    Lê TODOS os arquivos .pdf encontrados na pasta especificada.
    """
    arquivos = [f for f in os.listdir(pasta) if f.lower().endswith('.pdf')]
    
    if not arquivos:
        print("❌ Nenhum arquivo PDF encontrado nesta pasta.")
        sys.exit(1)

    print(f"📚 Encontrados {len(arquivos)} documentos: {arquivos}")
    
    todos_documentos = []

    for arquivo in arquivos:
        print(f"   ... Lendo: {arquivo}")
        try:
            path_completo = os.path.join(pasta, arquivo)
            reader = PdfReader(path_completo)
            
            doc_atual = None
            
            for page_idx, page in enumerate(reader.pages):
                texto_pagina = page.extract_text() or ""
                linhas = [l for l in texto_pagina.splitlines() if l.strip()]

                for linha in linhas:
                    # Tenta achar parágrafo numerado (123. Texto)
                    m = PARAGRAFO_REGEX.match(linha)
                    
                    if m:
                        # Salva o anterior se existir
                        if doc_atual:
                            todos_documentos.append(doc_atual)
                        
                        num = m.group(1)
                        resto = m.group(2)
                        
                        doc_atual = {
                            "paragrafo": num,
                            "texto": resto,
                            "pagina": page_idx + 1,
                            "origem": arquivo # Guarda de qual livro veio
                        }
                    else:
                        # Se não é novo parágrafo, continua o texto do anterior
                        if doc_atual:
                            doc_atual["texto"] += " " + linha
                        else:
                            # Caso o PDF comece sem número, cria um bloco genérico
                            # Útil para introduções ou documentos sem numeração
                            pass 

            # Adiciona o último parágrafo do arquivo
            if doc_atual:
                todos_documentos.append(doc_atual)

        except Exception as e:
            print(f"   ⚠️ Erro ao ler {arquivo}: {e}")

    print(f"✅ Total indexado: {len(todos_documentos)} parágrafos.")
    return todos_documentos

def tokenizar(texto: str, remover_stopwords: bool = True) -> List[str]:
    tokens = re.findall(r'\w+', texto.lower())
    if remover_stopwords:
        tokens = [t for t in tokens if t not in STOPWORDS_PT and len(t) > 2]
    return tokens

def preparar_bm25(documentos: List[Dict]):
    corpus_tokens = [tokenizar(doc["texto"]) for doc in documentos]
    bm25 = BM25Okapi(corpus_tokens)
    return bm25

def expandir_consulta(tokens: List[str]) -> List[str]:
    expandido = set(tokens)
    for t in tokens:
        for chave, valores in SINONIMOS.items():
            if t in valores or t == chave:
                expandido.update(valores)
    return list(expandido)

def verificar_cobertura(doc_texto: str, termos_consulta: List[str]) -> float:
    doc_tokens = set(tokenizar(doc_texto, remover_stopwords=False))
    termos_presentes = 0
    for termo in termos_consulta:
        if any(termo in t for t in doc_tokens):
            termos_presentes += 1
    if len(termos_consulta) == 0: return 0.0
    return termos_presentes / len(termos_consulta)

def buscar(documentos: List[Dict], bm25: BM25Okapi, pergunta: str, top_n: int = 3) -> List[Dict]:
    tokens_limpos = tokenizar(pergunta, remover_stopwords=True)
    if not tokens_limpos: return []

    tokens_expandidos = expandir_consulta(tokens_limpos)
    scores = bm25.get_scores(tokens_expandidos)
    
    idx_ordenados = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    resultados = []
    
    for i in idx_ordenados:
        if len(resultados) >= top_n: break
            
        score = float(scores[i])
        doc = documentos[i]
        cobertura = verificar_cobertura(doc["texto"], tokens_limpos)
        
        # Regras de corte
        score_minimo = 1.0
        cobertura_minima = 0.5 if len(tokens_limpos) > 1 else 1.0

        if score > score_minimo and cobertura >= cobertura_minima:
            res = doc.copy()
            res["score"] = score
            res["cobertura"] = cobertura
            resultados.append(res)
            
    return resultados

def imprimir_resultados(resultados: List[Dict]):
    if not resultados:
        print("🤔 Não encontrei essa informação nos documentos oficiais.")
        print("Tente usar termos como 'matrimônio', 'pecado', 'missa'.")
        return
        
    print(f"Encontrei {len(resultados)} trechos relevantes:\n")
    for r in resultados:
        trecho = r["texto"]
        if len(trecho) > 400:
            trecho = trecho[:400] + "..."
            
        # Mostra de qual livro veio (Catecismo, Código, etc)
        print(f"📖 [{r['origem']}] Parágrafo/Cânon {r['paragrafo']}")
        print(f"Relevância: {r['score']:.2f} | Cobertura: {r['cobertura']*100:.0f}%")
        print(f"\"{trecho}\"\n")

def main():
    # Agora chama a função que varre a pasta inteira
    documentos = carregar_todos_pdfs()
    
    if not documentos:
        print("❌ Nenhum parágrafo foi extraído. Verifique a formatação dos PDFs.")
        sys.exit(1)

    bm25 = preparar_bm25(documentos)
    
    print("\n" + "="*70)
    print("✝️  CATEQUISTA BOT MULTI-LIVROS (Lê todos os PDFs da pasta)")
    print("="*70 + "\n")

    while True:
        pergunta = input("👤 Pergunta: ")
        if pergunta.lower() in ["sair", "fim"]:
            break

        resultados = buscar(documentos, bm25, pergunta, top_n=3)
        
        print("-" * 70)
        imprimir_resultados(resultados)
        print("-" * 70 + "\n")

if __name__ == "__main__":
    main()