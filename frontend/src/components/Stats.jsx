import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function Stats({ history }) {
  const total = history.length;
  const produtivos = history.filter((e) => e.category === "Produtivo").length;
  const improdutivos = total - produtivos;
  const percProd = total ? Math.round((produtivos / total) * 100) : 0;
  const percImp = total ? Math.round((improdutivos / total) * 100) : 0;

  // Dados para o gráfico de pizza
  const pieData = [
    { name: 'Produtivos', value: produtivos, color: '#22c55e' },
    { name: 'Improdutivos', value: improdutivos, color: '#f59e0b' }
  ];

  // Função para gerar dados do gráfico de barras por dia da semana
  const buildBarData = (history) => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = weekDays.map(day => ({ name: day, produtivos: 0, improdutivos: 0 }));

    history.forEach(email => {
      if (!email.created_at) return;
      const date = new Date(email.created_at);
      const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]; // pega dia correto
      const item = data.find(d => d.name === dayName);
      if (item) {
        if (email.category === 'Produtivo') item.produtivos += 1;
        else item.improdutivos += 1;
      }
    });

    return data;
  };

  const barData = buildBarData(history);

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
          <TrendingUp className="w-5 h-5" />
          Estatísticas de Análise
        </h3>
      </div>

      <div className="px-6 py-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-600">Total de Emails</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{produtivos}</div>
            <div className="text-sm text-gray-600">Produtivos ({percProd}%)</div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <XCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{improdutivos}</div>
            <div className="text-sm text-gray-600">Improdutivos ({percImp}%)</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Pizza */}
          <div>
            <h4 className="text-lg font-medium mb-4 text-center text-gray-900">Distribuição por Categoria</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div>
            <h4 className="text-lg font-medium mb-4 text-center text-gray-900">Tendência Semanal</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="produtivos" fill="#22c55e" name="Produtivos" />
                  <Bar dataKey="improdutivos" fill="#f59e0b" name="Improdutivos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Insights</h4>
          <div className="text-sm text-blue-800">
            {percProd > 70 ? (
              <p>Excelente! A maioria dos seus emails são produtivos. Continue mantendo essa eficiência!</p>
            ) : percProd > 50 ? (
              <p>Boa proporção de emails produtivos. Considere filtrar melhor os emails que chegam até você.</p>
            ) : (
              <p>Muitos emails improdutivos. Considere usar filtros mais rigorosos ou revisar suas assinaturas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
