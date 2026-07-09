import React, { useState, useEffect } from 'react';
import { X, Key, Shield, CheckCircle2 } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) setApiKey(storedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pengaturan Sistem</h2>
              <p className="text-xs text-slate-500">Konfigurasi API Key AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-4 flex gap-3">
            <Shield className="text-indigo-500 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-300 mb-1">Keamanan Data Terjamin</p>
              API Key Anda disimpan murni secara lokal di dalam browser (localStorage). Sistem kami tidak memiliki server, sehingga tidak ada data yang dicuri atau disalahgunakan.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSyB..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
            />
            <p className="text-xs text-slate-500">
              Dapatkan API Key gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Google AI Studio</a>.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-[0.98]"
          >
            {saved ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Tersimpan!</span>
              </>
            ) : (
              'Simpan Pengaturan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
