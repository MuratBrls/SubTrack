import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import Button from './Button';
import { Subscription } from '../types';

interface CredentialsModalProps {
  subscription: Subscription;
  onClose: () => void;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({ subscription, onClose }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleCopy = (text: string, isEmail: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEmail) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-slate-700 pb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
           {subscription.logoUrl && <img src={subscription.logoUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{subscription.name}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Credentials Vault</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Username / Email</label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-200 text-sm font-mono break-all">
              {subscription.accountEmail || 'Not set'}
            </div>
            {subscription.accountEmail && (
              <button 
                onClick={() => handleCopy(subscription.accountEmail!, true)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors"
              >
                {copiedEmail ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Password</label>
          <div className="flex gap-2">
             <div className="flex-1 p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-200 text-sm font-mono flex justify-between items-center">
              <span>
                {subscription.accountPassword 
                    ? (showPass ? subscription.accountPassword : '••••••••••••') 
                    : 'Not set'}
              </span>
              {subscription.accountPassword && (
                  <button onClick={() => setShowPass(!showPass)} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
              )}
            </div>
            {subscription.accountPassword && (
              <button 
                onClick={() => handleCopy(subscription.accountPassword!, false)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors"
              >
                {copiedPass ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default CredentialsModal;