from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import re
import unicodedata
import PyPDF2
from dotenv import load_dotenv
import os
import json
from datetime import datetime

# Importação do Google Gemini AI
import google.generativeai as genai

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração da API do Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Inicialização do modelo Gemini
model = genai.GenerativeModel(model_name="gemini-2.5-flash")

# Criação da aplicação FastAPI
app = FastAPI(
    title="Classificador de Emails API",
    description="API para classificação automática de emails usando IA",
    version="1.0.0"
)

# Configuração de CORS para permitir requisições do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_text(text: str) -> str:
    """
    Limpa e normaliza o texto removendo caracteres especiais, invisíveis e normalizando espaços.
    """
    if isinstance(text, bytes):
        text = text.decode("utf-8", errors="replace")
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\u200B-\u200F\uFEFF]', ' ', text)
    text = re.sub(r'[\U00010000-\U0010FFFF]', ' ', text)
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_text(file: UploadFile) -> str:
    """
    Extrai texto de arquivos PDF, TXT ou EML.
    """
    if file.filename.endswith((".txt", ".eml")):
        return clean_text(file.file.read().decode("utf-8", errors="ignore"))
    elif file.filename.endswith(".pdf"):
        pdf_reader = PyPDF2.PdfReader(file.file)
        pages = [page.extract_text() or "" for page in pdf_reader.pages]
        return clean_text("\n".join(pages))
    return ""

# ============================================================================

@app.post("/analyze")
async def analyze_email(
    file: UploadFile = None,
    email_text: str = Form(None),
    extra_context: str = Form(None)
):
    try:
        # 1️⃣ Extrair texto
        text = ""
        if file:
            text = extract_text(file)
        elif email_text:
            text = clean_text(email_text)

        if not text:
            return {"error": "Nenhum texto fornecido para análise"}

        if extra_context:
            text += f"\n\nContexto adicional: {extra_context}"

        # 2️⃣ Criar prompt
        prompt = f"""
        Tarefa: Classifique o e-mail a seguir em "Produtivo" ou "Improdutivo".
        Caso seja "Produtivo", sugira uma resposta de email profissional e forneça uma justificativa concisa para a classificação.

        Critério Principal: A classificação e a resposta dependem exclusivamente da necessidade de uma ação imediata e relevante pelo destinatário.

        Regras de Classificação:
        - "Produtivo": Exige resposta, tarefa ou aprovação.
        - "Improdutivo": Não exige resposta ou ação.

        Formato de saída JSON (retorne APENAS o JSON, sem explicações adicionais):
        {{
        "category": "Produtivo" ou "Improdutivo",
        "reason": "Justificativa concisa",
        "suggestion": "Resposta do email se for produtivo, caso contrário vazio"
        }}

        Email:
        \"\"\"{text}\"\"\" 
        """.strip()

        # 3️⃣ Chamar Gemini
        generation_config = genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=800
        )

        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ]

        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        # --- DEBUG: imprime resposta do modelo ---
        try:
            print("--- RESPONSE RAW ---")
            print(response)
            if hasattr(response, "candidates"):
                for i, c in enumerate(response.candidates):
                    finish_reason = getattr(c, "finish_reason", None)
                    print(f"candidate[{i}]: finish_reason={finish_reason}")
                    if hasattr(c, "safety_ratings"):
                        print("safety_ratings:", c.safety_ratings)
                    if hasattr(c, "safety_attributes"):
                        print("safety_attributes:", c.safety_attributes)
        except Exception as e:
            print("Erro ao imprimir response:", e)
        print("---------------------")

        # 4️⃣ Verificar bloqueio
        blocked = False
        if response.candidates:
            finish = getattr(response.candidates[0], "finish_reason", None)
            if finish == 2 or str(finish).lower() in ("safety", "blocked", "content_filter"):
                blocked = True
            c = response.candidates[0]
            if hasattr(c, "safety_ratings"):
                for r in c.safety_ratings:
                    if getattr(r, "probability", 0) > 0.8:
                        blocked = True

        if blocked:
            return {
                "error": "Conteúdo bloqueado por filtros de segurança",
                "category": "Erro",
                "reason": "O modelo classificou parte do conteúdo como sensível ou com caracteres inválidos",
                "suggestion": "Texto sanitizado / remova anexos incomuns ou trechos sensíveis e tente novamente.",
                "created_at": datetime.utcnow().isoformat()
            }

        # 5️⃣ Interpretar resultado como JSON
        result_text = response.text or ""
        result_json = {}
        try:
            result_text = result_text.strip()
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
            result_json = json.loads(result_text)
        except json.JSONDecodeError:
            result_json = {}

        # Garantir originalText sempre
        result_json["originalText"] = text

        # Fallback por palavras-chave APENAS se não houver sugestão do modelo
        if not result_json.get("category"):
            text_lower = text.lower()
            productive_words = ['preciso', 'favor', 'urgente', 'confirmar', 'enviar', 'responder', 'aprovação', 'tarefa', 'reunião']
            is_productive = any(word in text_lower for word in productive_words)
            if is_productive:
                result_json["category"] = "Produtivo"
                result_json["reason"] = "Email parece requerer ação baseado em palavras-chave identificadas"
                result_json["suggestion"] = "Por favor, confirme o recebimento e nos informe sobre próximos passos."
            else:
                result_json["category"] = "Improdutivo"
                result_json["reason"] = "Email parece ser informativo ou não requer ação imediata"
                result_json["suggestion"] = ""

        # Se a categoria não for produtiva, zera a sugestão
        if result_json.get("category", "").lower() != "produtivo":
            result_json["suggestion"] = ""

        # ADICIONA DATA
        result_json["created_at"] = datetime.utcnow().isoformat()

        return result_json

    except Exception as e:
        return {
            "error": str(e),
            "category": "Erro",
            "reason": "Falha na análise do email",
            "suggestion": "",
            "created_at": datetime.utcnow().isoformat()
        }

# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "message": "API funcionando corretamente"}