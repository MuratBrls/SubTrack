import React, { useState, useEffect } from 'react';
import { Shield, Check, AlertCircle } from 'lucide-react';
import Button from './Button';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface VaultModalProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const VaultModal: React.FC<VaultModalProps> = ({ user, onSuccess, onCancel }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isSetup, setIsSetup] = useState(!user.hasVaultPin);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'setup_1' | 'setup_2'>(!user.hasVaultPin ? 'setup_1' : 'enter');
  const [error, setError] = useState('');

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;
    
    if (isConfirm) setConfirmPin(newPin);
    else setPin(newPin);

    // Auto focus next input
    if (value && index < 3) {
      const nextId = isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`;
      document.getElementById(nextId)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm = false) => {
    if (e.key === 'Backspace' && !(isConfirm ? confirmPin : pin)[index] && index > 0) {
      const prevId = isConfirm ? `confirm-pin-${index - 1}` : `pin-${index - 1}`;
      document.getElementById(prevId)?.focus();
    }
  };

  const handleSubmit = () => {
    const pinStr = pin.join('');
    
    if (step === 'enter') {
      if (storageService.validateVaultPin(user.id, pinStr)) {
        onSuccess();
      } else {
        setError('Incorrect PIN');
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    } else if (step === 'setup_1') {
      if (pinStr.length !== 4) return;
      setStep('setup_2');
      // Clear logic handled by separate confirm state
    } else if (step === 'setup_2') {
      const confirmStr = confirmPin.join('');
      if (pinStr === confirmStr) {
        storageService.setVaultPin(user.id, pinStr);
        onSuccess();
      } else {
        setError('PINs do not match. Try again.');
        setStep('setup_1');
        setPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        setTimeout(() => document.getElementById('pin-0')?.focus(), 100);
      }
    }
  };

  useEffect(() => {
      // Focus first input on mount
      document.getElementById('pin-0')?.focus();
  }, []);

  return (
    <div className="p-4 text-center">
      <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {step === 'enter' ? 'Enter Vault PIN' : step === 'setup_1' ? 'Create Vault PIN' : 'Confirm Vault PIN'}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        {step === 'enter' 
          ? 'Enter your 4-digit secure PIN to view credentials.' 
          : step === 'setup_1' 
            ? 'Create a 4-digit PIN to protect your passwords.'
            : 'Re-enter your PIN to confirm.'}
      </p>

      <div className="flex justify-center gap-3 mb-6">
        {(step === 'setup_2' ? confirmPin : pin).map((digit, idx) => (
          <input
            key={idx}
            id={step === 'setup_2' ? `confirm-pin-${idx}` : `pin-${idx}`}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handlePinChange(idx, e.target.value, step === 'setup_2')}
            onKeyDown={(e) => handleKeyDown(idx, e, step === 'setup_2')}
            className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-slate-600 rounded-lg focus:border-indigo-500 focus:ring-0 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2 text-red-500 text-sm mb-4 animate-pulse">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={(step === 'setup_2' ? confirmPin : pin).join('').length !== 4}
        >
          {step === 'setup_1' ? 'Next' : 'Unlock'}
        </Button>
      </div>
    </div>
  );
};

export default VaultModal;