from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
import requests
import json

app = Flask(__name__)
CORS(app)

print("--- SERVIDOR PAROQUIAL: VERSÃO RIGOROSA (MISTRAL) ---")

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.Client()
try: chroma_client.delete_collection("web_db")
except: pass
collection = chroma_client.create_collection(name="web_db")

def carregar_documentos():
    folder_path = "meus_pdfs"
    if not os.path.exists(folder_path): return
    print("Lendo documentos...")
    files = os.listdir(folder_path)
    for filename in files:
        path = os.path.join(folder_path, filename)
        text = ""
        try:
            if filename.lower().endswith('.pdf'):
                reader = PdfReader(path)
                for page in reader.pages:
                    t = page.extract_text()
                    if t: text += t.replace('\n', ' ') + " "
            elif filename.lower().endswith('.txt'):
                try:
                    with open(path, 'r', encoding='utf-8') as f: text = f.read()
                except:
                    with open(path, 'r', encoding='latin-1') as f: text = f.read()
            
            if not text.strip(): continue
            chunks = [text[i:i+1000] for i in range(0, len(text), 900)]
            if chunks:
                embeddings = embedding_model.encode(chunks).tolist()
                ids = [f"{filename}_{i}" for i in range(len(chunks))]
                metadatas = [{"source": filename} for _ in chunks]
                collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
        except: pass
    print("Conhecimento atualizado.")

carregar_documentos()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '')
    history_raw = data.get('history', [])[-4:] 
    
    conversation_history = ""
    for msg in history_raw:
        role = "ASSISTENTE" if msg['sender'] == 'bot' else "USUÁRIO"
        conversation_history += f"{role}: {msg['text']}\n"

    if not user_query: return jsonify({"reply": "Paz e bem!"})

    # Busca contexto
    query_vec = embedding_model.encode([user_query]).tolist()
    results = collection.query(query_embeddings=query_vec, n_results=3)
    
    doc_context = ""
    if results['documents'][0]:
        for doc in results['documents'][0]:
            doc_context += f"{doc}\n\n"
    
    if not doc_context: doc_context = "NENHUMA informação encontrada nos documentos."

    # --- PROMPT "CHECKLIST" (Mais fácil para a IA seguir) ---
    prompt = f"""
    Você é um assistente da Paróquia. Sua função é estritamente responder sobre a Paróquia e Fé Católica.

    Siga este raciocínio passo-a-passo antes de responder:

    PASSO 1 - ANALISAR A PERGUNTA:
    O usuário perguntou sobre: "{user_query}"
    Isso tem relação com Igreja, Missa, Catecismo, Deus ou Avisos Paroquiais?
    
    -> SE NÃO TIVER RELAÇÃO (ex: futebol, fusca, política, piada):
       PARE TUDO. Responda APENAS: "Perdão, mas eu só sei falar sobre assuntos da nossa Paróquia e da nossa fé."
    
    -> SE TIVER RELAÇÃO:
       Vá para o PASSO 2.

    PASSO 2 - VERIFICAR CUMPRIMENTO:
    É apenas um "Oi", "Bom dia" ou o usuário dizendo o nome?
    -> SE SIM: Seja educado e pergunte como ajudar (mas não repita se já disse antes no histórico).
    -> SE NÃO: Vá para o PASSO 3.

    PASSO 3 - BUSCAR RESPOSTA:
    Use o CONTEXTO abaixo para responder.
    Se a resposta não estiver no contexto, diga: "Não encontrei essa informação nos meus documentos, favor ligar na secretaria."

    ---
    CONTEXTO DOS DOCUMENTOS:
    {doc_context}

    HISTÓRICO DA CONVERSA:
    {conversation_history}

    SUA RESPOSTA (Em Português):
    """

    try:
        # IMPORTANTE: Mudei para 'mistral' pois ele obedece melhor a lógica negativa
        response = requests.post("http://localhost:11434/api/generate", json={
            "model": "mistral", 
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1 # Criatividade quase zero para evitar desvios
            }
        })
        
        # Tratamento de erro caso o usuário não tenha o Mistral baixado
        if response.status_code == 404:
             return jsonify({"reply": "Erro: O modelo 'mistral' não está instalado. Rode 'ollama run mistral' no terminal."})
             
        return jsonify({"reply": response.json()['response']})
    except:
        return jsonify({"reply": "Erro de conexão."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)