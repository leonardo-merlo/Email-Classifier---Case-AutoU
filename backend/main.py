from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import re
import unicodedata
import PyPDF2
from dotenv import load_dotenv
import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import json


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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://email-classifier-autou.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- substitua estas duas funções no seu código ---

def clean_text(text: str) -> str:
    # Normaliza para NFC (mantém acentos) e remove só caracteres de controle básicos
    if not isinstance(text, str):
        text = str(text)
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\uFEFF]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def extract_text(file: UploadFile) -> str:
    # Lê bytes brutos
    raw = file.file.read()

    # Para .txt e .eml: tenta utf-8 e, se falhar, cai para latin-1 (recupera acentos)
    if (file.filename or "").lower().endswith((".txt", ".eml")):
        try:
            text = raw.decode("utf-8")
        except Exception:
            text = raw.decode("latin-1", errors="replace")
        return clean_text(text)

    # Para PDF: tenta PyPDF2 (se falhar ou vier vazio, faz fallback simples para decodificar bytes)
    if (file.filename or "").lower().endswith(".pdf"):
        try:
            file.file.seek(0)
            pdf_reader = PyPDF2.PdfReader(file.file)
            pages = [p.extract_text() or "" for p in pdf_reader.pages]
            text = "\n".join(pages).strip()
            if text:
                return clean_text(text)
        except Exception:
            pass
        # fallback simples: tenta decodificar como latin-1 (pior caso)
        try:
            return clean_text(raw.decode("latin-1", errors="replace"))
        except Exception:
            return clean_text(str(raw))

    # Outros tipos: tenta utf-8 -> latin-1
    try:
        return clean_text(raw.decode("utf-8"))
    except Exception:
        return clean_text(raw.decode("latin-1", errors="replace"))


# ============================================================================

@app.post("/analyze")
async def analyze_email(
    file: UploadFile = None,
    email_text: str = Form(None),
    extra_context: str = Form(None)
):
    try:
        # Extrair texto
        text = ""
        if file:
            text = extract_text(file)
        elif email_text:
            text = clean_text(email_text)

        if not text:
            return {"error": "Nenhum texto fornecido para análise"}

        if extra_context:
            text += f"\n\nContexto adicional: {extra_context}"

        text_safe = json.dumps(text)  # transforma o texto em string JSON válida, escapa aspas e acentos

        # Criar prompt
        prompt = f"""
        Tarefa: Classifique o e-mail a seguir em "Produtivo" ou "Improdutivo".
        Caso seja "Produtivo", sugira uma resposta de email profissional e forneça uma justificativa concisa para a classificação.

        Critério Principal: A classificação e a resposta dependem exclusivamente da necessidade de uma ação imediata e relevante pelo destinatário.

        Regras de Classificação:
        - "Produtivo": Exige resposta, tarefa ou aprovação.
        - "Improdutivo": Não exige resposta ou ação, ou não contém contexto ou informações adicionais que ajudem a entender do que se trata.

        Formato de saída JSON (retorne APENAS o JSON, sem explicações adicionais):
        {{
        "category": "Produtivo" ou "Improdutivo",
        "reason": "Justificativa concisa",
        "suggestion": "Resposta do email se for produtivo, caso contrário vazio"
        }}

        Email:
        {text_safe}
        """.strip()

        # Chamar Gemini
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

                # Interpretar resultado como JSON
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

        # Adicior data
        BR_TZ = ZoneInfo("America/Sao_Paulo")
        now_br = datetime.now().astimezone(BR_TZ)
        result_json["created_at"] = now_br.isoformat()
        print("Horário de criação (BR):", result_json["created_at"])   

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