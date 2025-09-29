   # 📧 Classificador de Emails com IA

**Descrição:** Aplicativo para análise automática de emails usando IA (Google Gemini). Classifica emails como **Produtivo** ou **Improdutivo**, gera sugestões de respostas personalizadas e apresenta estatísticas semanais de produtividade.

---

## 🚀 Funcionalidades Principais

* 📂 **Upload de Arquivos:** PDF, TXT ou EML para análise automática.
* ✏️ **Texto do Email e Contexto Adicional:** insira diretamente ou complemente a análise.
* 🏷️ **Classificação Inteligente:** Produtivo ou Improdutivo com justificativa concisa.
* 💬 **Sugestão de Resposta:** resposta profissional personalizada para emails produtivos.
* 📊 **Estatísticas Visuais:** porcentagem de emails produtivos vs. improdutivos, com evolução semanal.
* 📝 **Visualização Detalhada:** cards com texto original, justificativa e resposta sugerida.
* 📋 **Ações Práticas:** botão de copiar resposta, reset completo de emails.
* 💾 **Persistência Local:** todos os dados são salvos em LocalStorage, mantendo o histórico entre sessões.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** React + TailwindCSS
* **Backend:** FastAPI, Python 3.11+, PyPDF2
* **IA:** Google Gemini AI
* **Persistência:** LocalStorage
* **CORS:** configurado para frontend local e produção

---

## ⚡ Configuração Local

### Backend

1. Navegue até a pasta `backend`.
2. Crie um arquivo `.env` com sua chave da API Gemini:

   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Instale dependências:

   ```
   pip install -r requirements.txt
   ```
4. Inicie o servidor local:

   ```
   uvicorn main:app --reload
   ```
5. Backend disponível em: `http://127.0.0.1:8000`.

> 🔹 No frontend local, ajuste o endpoint Axios para:
>
> ```javascript
> const res = await axios.post("http://127.0.0.1:8000/analyze", formData);
> ```

### Frontend

1. Navegue até a pasta `frontend`.
2. Instale dependências:

   ```
   npm install
   ```
3. Inicie o frontend:

   ```
   npm run dev
   ```
4. Frontend disponível em: `http://localhost:5173`.

---

## 📝 Considerações Importantes

* 🔑 **Chave Gemini:** necessária para autenticação; crie no Google Cloud.
* 🕒 **Fuso horário:** backend retorna horários em `America/Sao_Paulo`.
* 🌐 **CORS:** já configurado para localhost e URL de produção.
* 🔒 **Segurança:** nunca exponha a chave Gemini no frontend.
