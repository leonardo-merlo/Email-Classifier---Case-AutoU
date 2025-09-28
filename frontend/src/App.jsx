import { useState, useEffect } from "react";
import UploadForm from "./components/UploadForm";
import EmailCard from "./components/EmailCard";
import Stats from "./components/Stats";
import { Mail, Trash2 } from "lucide-react";

function App() {
  useEffect(() => {
    document.title = "Classificador de Emails";
    
    // SVG do ícone Mail do Lucide inline
    const svgFavicon = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    `)}`;
    
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    favicon.type = 'image/svg+xml';
    favicon.rel = 'icon';
    favicon.href = svgFavicon;
    document.head.appendChild(favicon);
  }, []);

  const [history, setHistory] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Carrega histórico do localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(stored);
  }, []);

  const handleNewResult = (result) => {
    const newHistory = [result, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  const handleResetHistory = () => {
    setHistory([]);
    localStorage.removeItem("history");
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen from-gray-50 to-primary-50">
      <div className="floating-bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>
      {/* Header com título e subtítulo */}
      <header className="text-center pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-2">
            Classificador de Emails
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto py-2">
            Analise a importância de seus emails com inteligência artificial e receba sugestões de resposta personalizadas.
          </p>
        </div>
      </header>

      {/* Formulário de upload centralizado */}
      <main className="max-w-2xl mx-auto px-4 mb-12 relative z-10">
        <div className="animate-fade-in">
          <UploadForm onNewResult={handleNewResult} />
        </div>
      </main>

      {/* Estatísticas com gráfico */}
      {history.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-12 relative z-10">
          <div className="animate-fade-in">
            <Stats history={history} />
          </div>
        </section>
      )}

      {/* Cards de emails */}
      {history.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {history.map((item, idx) => (
              <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <EmailCard email={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Botão de reset */}
            {history.length > 0 && (
        <section className="max-w-2xl mx-auto px-4 pb-12 relative z-10">
          <div className="text-center relative">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Histórico
            </button>
            
            {/* Modal de confirmação posicionado em cima do botão */}
            {showResetConfirm && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 overflow-hidden animate-fade-in">
                  {/* Seta apontando para baixo */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                  
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">Confirmar Limpeza</h3>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-gray-600">
                      Tem certeza que deseja limpar todo o histórico de emails? Esta ação não pode ser desfeita.
                    </p>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleResetHistory}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      
    </div>
  );
}

export default App;
