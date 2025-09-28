import { useState } from "react";
import axios from "axios";
import { Upload, FileText, Send, Loader2 } from "lucide-react";

export default function UploadForm({ onNewResult }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file && !text.trim()) {
      setError("Por favor, forneça um arquivo ou cole o texto do email.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (text.trim()) formData.append("email_text", text.trim());
      if (context.trim()) formData.append("extra_context", context.trim());

      const res = await axios.post("http://127.0.0.1:8000/analyze", formData);
      onNewResult(res.data);
      
      // Limpar formulário após sucesso
      setFile(null);
      setText("");
      setContext("");
      document.getElementById("file-input").value = "";
    } catch (err) {
      setError("Erro ao analisar o email. Tente novamente.");
      console.error("Erro:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError("");
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-semibold text-center text-gray-900">Analisar Email</h2>
        <p className="text-gray-600 text-center mt-1">
          Faça upload de um arquivo ou cole o texto do email para análise
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-6">
        {/* Upload de arquivo */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Upload className="w-4 h-4 text-gray-500" />
            Upload de Arquivo (PDF, TXT, EML)
          </label>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt,.eml"
            onChange={handleFileChange}
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Arquivo selecionado: {file.name}
            </p>
          )}
        </div>

        {/* Divisor */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">ou</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Texto do email */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Texto do Email
          </label>
          <textarea
            placeholder="Cole aqui o conteúdo do email que deseja analisar..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-vertical min-h-[120px]"
            rows={6}
          />
        </div>

        {/* Contexto adicional */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contexto ou Sugestões (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: informações do remetente ou padrão de resposta personalizada"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Botão de envio */}
        <button
          type="submit"
          disabled={isLoading || (!file && !text.trim())}
          style={{ backgroundColor: '#22c55e' }}
          className="w-full h-12 rounded-md text-white font-medium shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Analisar Email
            </>
          )}
        </button>
      </form>
    </div>
  );
}
