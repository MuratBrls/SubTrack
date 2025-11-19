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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center transition-colors">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
          <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No data to analyze</h3>
        <p className="mt-1 text-gray-500 dark:text-slate-400">Add subscriptions to see your spending breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
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
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex flex-col justify-center transition-colors">
          <div className="text-center">
            <span className="text-gray-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">Monthly Average</span>
            <div className="mt-2 flex items-center justify-center text-5xl font-bold text-gray-900 dark:text-white">
              ${totalMonthly.toFixed(2)}
            </div>
            <p className="mt-2 text-gray-500 dark:text-slate-400">Estimated per year: ${ (totalMonthly * 12).toFixed(2) }</p>
          </div>
          <div className="mt-8 flex justify-center">
            <Button onClick={handleAnalyze} loading={loading} disabled={loading || !process.env.API_KEY}>
              <BrainCircuit className="w-4 h-4 mr-2" />
              AI Spending Analysis
            </Button>
          </div>
          {!process.env.API_KEY && <p className="text-xs text-red-400 text-center mt-2">API Key not configured</p>}
        </div>
      </div>

      {/* AI Analysis Result */}
      {analysis && (
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-100 dark:border-slate-700 p-6 shadow-sm animate-fade-in">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Lightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">Smart Insights</h3>
              <p className="mt-1 text-indigo-800 dark:text-slate-300 text-sm leading-relaxed">
                {analysis.insight}
              </p>
              
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider mb-3">Savings Tips</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {analysis.savingsTips.map((tip, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-indigo-100 dark:border-slate-700 shadow-sm text-sm text-gray-700 dark:text-slate-300">
                      <span className="text-indigo-500 dark:text-indigo-400 font-bold mr-2">#{idx + 1}</span>
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