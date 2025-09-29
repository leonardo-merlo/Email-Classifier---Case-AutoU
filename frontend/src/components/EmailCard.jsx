import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Clock,
  User,
  Building,
} from "lucide-react";

export default function EmailCard({ email }) {
  const [copied, setCopied] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Determinar o status e cores baseado na categoria
  const getStatusInfo = () => {
    switch (email.category) {
      case "Produtivo":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-800",
          titleColor: "text-green-900",
        };
      case "Improdutivo":
        return {
          icon: XCircle,
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-600",
          badgeColor: "bg-orange-100 text-orange-800",
          titleColor: "text-orange-900",
        };
      case "Erro":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          badgeColor: "bg-red-100 text-red-800",
          titleColor: "text-red-900",
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          badgeColor: "bg-gray-100 text-gray-800",
          titleColor: "text-gray-900",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Copiar sugestão de resposta
  const handleCopySuggestion = async () => {
    if (email.suggestion) {
      try {
        await navigator.clipboard.writeText(email.suggestion);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Erro ao copiar:", err);
      }
    }
  };

  // Truncar texto se for muito longo
  const truncateText = (text, maxLength = 200) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        email.category === "Produtivo"
          ? "border-green-200 bg-green-50"
          : email.category === "Improdutivo"
          ? "border-orange-200 bg-orange-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      {/* Header do card */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon
              className={`w-6 h-6 ${
                email.category === "Produtivo"
                  ? "text-green-600"
                  : email.category === "Improdutivo"
                  ? "text-orange-600"
                  : "text-red-600"
              }`}
            />
            <div>
              <h3
                className={`text-lg font-semibold ${
                  email.category === "Produtivo"
                    ? "text-green-900"
                    : email.category === "Improdutivo"
                    ? "text-orange-900"
                    : "text-red-900"
                }`}
              >
                {email.category}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="px-6 py-6">
        {/* Justificativa */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Justificativa</h4>
          <p className="text-gray-700 text-sm leading-relaxed">
            {email.reason || "Nenhuma justificativa fornecida"}
          </p>
        </div>

        {/* Texto original do email (se disponível) */}
        {email.originalText && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Email Original</h4>
            </div>
            <div className="bg-white p-3 rounded border text-sm text-gray-600 max-h-32 overflow-y-auto">
              {showFullText
                ? email.originalText
                : truncateText(email.originalText)}
              {email.originalText.length > 200 && (
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-primary-600 hover:text-primary-700 text-xs ml-2"
                >
                  {showFullText ? "Ver menos" : "Ver mais"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sugestão de resposta (apenas para emails produtivos) */}
        {email.suggestion && email.category === "Produtivo" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">
                Sugestão de Resposta
              </h4>
              <button
                onClick={handleCopySuggestion}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-green-900 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200"
                title="Copiar sugestão de resposta"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <div className="bg-white p-4 rounded border border-green-200">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {email.suggestion}
              </p>
            </div>
          </div>
        )}

        {/* Informações adicionais se disponíveis */}
        {email.sender && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{email.sender}</span>
            {email.company && (
              <>
                <Building className="w-4 h-4 ml-2" />
                <span>{email.company}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {email.created_at
              ? (() => {
                  const date = new Date(email.created_at);
                  // Ajuste de 3 horas de diferença (UTC: GMT-3)
                  date.setHours(date.getHours() - 3);
                  return date.toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                })()
              : "-"}
          </div>
          {email.suggestion && email.category === "Produtivo" && (
            <div className="text-xs text-green-600 font-medium">
              ✓ Resposta sugerida
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
