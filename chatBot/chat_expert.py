import os
import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
import requests
import json

class ParoquiaBot:
    def __init__(self):
        print("--- CHATBOT PAROQUIAL (DOUTRINA + AVISOS) ---")
        
        # Modelo de Embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        self.chroma_client = chromadb.Client()
        try: self.chroma_client.delete_collection("paroquia_db")
        except: pass
        self.collection = self.chroma_client.create_collection(name="paroquia_db")

        # Verifica conexão com Ollama
        try:
            requests.get("http://localhost:11434/")
            print("-> Conexão com Ollama: OK!")
        except:
            print("\nERRO: O Ollama não está rodando.\n")

    def process_folder(self, folder_path):
        if not os.path.exists(folder_path):
            return

        # Lista tudo que está na pasta
        files = os.listdir(folder_path)
        print(f"Lendo documentos na pasta '{folder_path}'...")

        for filename in files:
            path = os.path.join(folder_path, filename)
            text = ""
            
            # --- LÓGICA HÍBRIDA: PDF ou TXT ---
            try:
                if filename.endswith('.pdf'):
                    print(f" -> Lendo PDF: {filename}...")
                    reader = PdfReader(path)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted: text += extracted.replace('\n', ' ') + " "
                
                elif filename.endswith('.txt'):
                    print(f" -> Lendo AVISOS: {filename}...")
                    # 'utf-8' é importante para ler acentos corretamente
                    with open(path, 'r', encoding='utf-8') as f:
                        text = f.read()
                
                else:
                    continue # Pula arquivos que não sejam PDF ou TXT

                # Se não extraiu nada, pula
                if not text.strip(): continue

                # Chunking (Divisão do texto)
                chunk_size = 1000
                overlap = 200
                chunks = []
                for i in range(0, len(text), chunk_size - overlap):
                    chunks.append(text[i:i + chunk_size])
                
                if chunks:
                    embeddings = self.embedding_model.encode(chunks).tolist()
                    ids = [f"{filename}_{i}" for i in range(len(chunks))]
                    metadatas = [{"source": filename} for _ in chunks]
                    self.collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
                    
            except Exception as e:
                print(f"Erro ao ler {filename}: {e}")

        print("Memória da Paróquia atualizada!")

    def ask(self, query):
        # Busca os 4 trechos mais relevantes (pode vir do PDF ou do TXT)
        query_vec = self.embedding_model.encode([query]).tolist()
        results = self.collection.query(query_embeddings=query_vec, n_results=4)
        
        if not results['documents'][0]:
            print("Não encontrei essa informação.")
            return

        docs = results['documents'][0]
        metas = results['metadatas'][0]
        
        # Monta o contexto mostrando a fonte (para você saber se veio do Catecismo ou dos Avisos)
        context = ""
        for doc, meta in zip(docs, metas):
            source_name = meta['source']
            context += f"FONTE [{source_name}]:\n{doc}\n\n"

        # --- PROMPT ESPECIALIZADO PARA A PARÓQUIA ---
        prompt = f"""Você é um assistente virtual da Paróquia Nossa Senhora da Assunção.
        Sua missão é ajudar os fiéis com dúvidas sobre a Doutrina Católica E TAMBÉM com informações práticas da paróquia (horários, avisos, secretaria).
        
        Use as informações abaixo para responder. 
        - Se a pergunta for sobre fé, use o Catecismo.
        - Se a pergunta for sobre a paróquia, use o arquivo de avisos/info.
        - Responda de forma acolhedora e em Português.
        
        INFORMAÇÕES ENCONTRADAS:
        {context}
        
        PERGUNTA DO FIEL: {query}
        """

        url = "http://localhost:11434/api/generate"
        payload = {
            "model": "mistral", # Use 'mistral' ou 'llama3'
            "prompt": prompt,
            "stream": True
        }

        print("\nResposta: ", end="", flush=True)
        try:
            with requests.post(url, json=payload, stream=True) as r:
                for line in r.iter_lines():
                    if line:
                        body = json.loads(line)
                        if "response" in body:
                            print(body["response"], end="", flush=True)
            print("\n")
        except Exception as e:
            print(f"\nErro: {e}")

if __name__ == "__main__":
    bot = ParoquiaBot()
    pasta = "meus_pdfs" # Coloque o catecismo.pdf E o info_paroquia.txt aqui
    
    if os.path.exists(pasta):
        bot.process_folder(pasta)
        while True:
            q = input("\nO que deseja saber? (ou 'sair'): ")
            if q.lower() in ['sair', 'exit']: break
            bot.ask(q)
    else:
        print(f"Pasta '{pasta}' não encontrada. Crie ela e coloque os arquivos.")