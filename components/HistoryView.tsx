import React, { useMemo } from 'react';
import { Subscription, PaymentRecord, CURRENCY_SYMBOLS, CATEGORY_COLORS } from '../types';
import { History, TrendingDown } from 'lucide-react';

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

  // Calculate total spent all time (converted loosely to display currency or just raw sum if simple)
  // For simplicity in this view, we just list them.

  if (allHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center transition-colors animate-fade-in">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-slate-700 mb-4">
          <History className="h-8 w-8 text-gray-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No payment history yet</h3>
        <p className="mt-2 text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
          Mark subscriptions as "Paid" in the dashboard to build your history log and track your spending over time.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-8 animate-fade-in">
      {Object.keys(groupedHistory).map((groupKey) => (
        <div key={groupKey}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">
            {groupKey}
          </h3>
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
              {groupedHistory[groupKey].map((record) => (
                <li key={record.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-opacity-10"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[record.category]}20`,
                          color: CATEGORY_COLORS[record.category]
                        }}
                      >
                        <TrendingDown className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{record.subscriptionName}</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {CURRENCY_SYMBOLS[record.currency]}{record.amount.toFixed(2)}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Paid
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