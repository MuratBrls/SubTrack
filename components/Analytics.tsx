import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Subscription, CATEGORY_COLORS, AnalysisResult } from '../types';
import { analyzeSubscriptions } from '../services/geminiService';
import Button from './Button';
import { BrainCircuit, Lightbulb, TrendingUp, Wallet } from 'lucide-react';

interface AnalyticsProps {
  subscriptions: Subscription[];
}

const Analytics: React.FC<AnalyticsProps> = ({ subscriptions }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate Category Data for Chart
  const categoryData = React.useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach(sub => {
      let cost = sub.price;
      if (sub.cycle === 'Yearly') cost = sub.price / 12;
      else if (sub.cycle === 'Weekly') cost = sub.price * 4;
      
      map[sub.category] = (map[sub.category] || 0) + cost;
    });

    return Object.keys(map).map(key => ({
      name: key,
      value: parseFloat(map[key].toFixed(2))
    })).filter(item => item.value > 0);
  }, [subscriptions]);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeSubscriptions(subscriptions);
    setAnalysis(result);
    setLoading(false);
  };

  const totalMonthly = categoryData.reduce((acc, cur) => acc + cur.value, 0);

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-12 text-center transition-colors">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 dark:bg-slate-800 mb-5">
          <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No data to analyze</h3>
        <p className="mt-2 text-gray-500 dark:text-slate-400">Add subscriptions to see your spending breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            Spending by Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none" 
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#94a3b8'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col justify-center transition-colors">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Monthly Average</span>
            <div className="mt-3 flex items-center justify-center text-5xl font-black text-gray-900 dark:text-white">
              ${totalMonthly.toFixed(2)}
            </div>
            <div className="mt-3 inline-block px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">Est. Annual: ${ (totalMonthly * 12).toFixed(2) }</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Button onClick={handleAnalyze} loading={loading} disabled={loading || !process.env.API_KEY} className="w-full max-w-xs">
              <BrainCircuit className="w-4 h-4 mr-2" />
              Generate AI Report
            </Button>
          </div>
          {!process.env.API_KEY && <p className="text-xs text-red-400 text-center mt-2">API Key not configured</p>}
        </div>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-8 shadow-lg animate-fade-in">
          <div className="flex items-start space-x-5">
            <div className="flex-shrink-0">
              <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-white">AI Insights</h3>
              <p className="mt-2 text-indigo-800 dark:text-slate-300 text-base leading-relaxed">
                {analysis.insight}
              </p>
              
              <div className="mt-8">
                <h4 className="text-xs font-bold text-indigo-400 dark:text-indigo-300 uppercase tracking-widest mb-4">Actionable Tips</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  {analysis.savingsTips.map((tip, idx) => (
                    <div key={idx} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-5 rounded-xl border border-white dark:border-slate-700 shadow-sm text-sm text-gray-800 dark:text-slate-200 hover:shadow-md transition-shadow">
                      <span className="block text-2xl font-black text-indigo-200 dark:text-slate-700 mb-2">0{idx + 1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;