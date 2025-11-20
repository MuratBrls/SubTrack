import React, { useMemo } from 'react';
import { Subscription, PaymentRecord, CURRENCY_SYMBOLS, CATEGORY_COLORS } from '../types';
import { History, TrendingDown, ArrowDownLeft } from 'lucide-react';

interface HistoryViewProps {
  subscriptions: Subscription[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ subscriptions }) => {
  // Aggregate and sort history from all subscriptions
  const allHistory = useMemo(() => {
    const history: PaymentRecord[] = [];
    subscriptions.forEach(sub => {
      if (sub.paymentHistory) {
        history.push(...sub.paymentHistory);
      }
    });
    // Sort by date descending (newest first)
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [subscriptions]);

  // Group by Month/Year
  const groupedHistory = useMemo(() => {
    const groups: Record<string, PaymentRecord[]> = {};
    allHistory.forEach(record => {
      const date = new Date(record.date);
      const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [allHistory]);

  if (allHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-16 text-center transition-colors animate-fade-in">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 dark:bg-slate-800 mb-6">
          <History className="h-10 w-10 text-gray-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No payment history</h3>
        <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Payments will appear here once you mark your subscriptions as paid.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {Object.keys(groupedHistory).map((groupKey) => (
        <div key={groupKey}>
          <div className="flex items-center gap-4 mb-4">
             <h3 className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              {groupKey}
            </h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-800"></div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
            <ul className="divide-y divide-gray-100 dark:divide-slate-800">
              {groupedHistory[groupKey].map((record) => (
                <li key={record.id} className="group px-6 py-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[record.category]}15`,
                          color: CATEGORY_COLORS[record.category]
                        }}
                      >
                        <ArrowDownLeft className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {record.subscriptionName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-slate-500">{new Date(record.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-300 dark:text-slate-600">•</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-slate-500">{record.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {CURRENCY_SYMBOLS[record.currency]}{record.amount.toFixed(2)}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mt-1">
                        Success
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryView;