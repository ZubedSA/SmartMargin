import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Sparkles, Calculator, RotateCcw, Download, Moon, Sun, Settings, Camera } from 'lucide-react';
import CalculatorRow from './components/CalculatorRow';
import GrandTotal from './components/GrandTotal';
import StandardCalculatorModal from './components/StandardCalculatorModal';
import SettingsModal from './components/SettingsModal';
import ReceiptScannerModal from './components/ReceiptScannerModal';
import { calculateRow } from './utils/aiEngine';
import useTheme from './hooks/useTheme';

function createEmptyRow(id) {
  return {
    id: id || Date.now() + Math.random(),
    harga: '',
    diskonPersen: '',
    diskonRupiah: '',
    ppnPersen: '',
    ppnRupiah: '',
    qty: '1',
    marginTarget: '20',
    marginGrosir1: '15',
    marginGrosir2: '10',
  };
}

function Header({ onReset, showInstallBtn, onInstall, theme, toggleTheme }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
            <Calculator size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-none">Smart Margin</h1>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">AI Business Pricing</p>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 ml-1">
            <Sparkles size={10} className="text-violet-500 dark:text-violet-400" />
            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">AI Powered</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showInstallBtn && (
            <button
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 hover:text-white dark:hover:text-white hover:bg-violet-500 dark:hover:bg-violet-600 hover:border-violet-500 dark:hover:border-violet-500 transition-all duration-300 shadow-md shadow-violet-200 dark:shadow-violet-950/40 animate-pulse active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              <span>Instal</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all duration-200"
            title="Toggle Tema"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Terang' : 'Gelap'}</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-800 transition-all duration-200"
            title="Pengaturan"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Setelan</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-white hover:bg-red-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all duration-200"
          >
            <RotateCcw size={15} className="sm:w-[13px] sm:h-[13px]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [rows, setRows] = useState([createEmptyRow()]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      console.log('Smart Margin was installed successfully.');
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Intercept F1 to toggle calculator modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsCalcOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUpdate = useCallback((index, field, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== index) return row;

      let updatedRow = { ...row, [field]: value };
      const harga = parseFloat(updatedRow.harga) || 0;

      if (field === 'harga') {
        if (updatedRow.diskonPersen !== '') {
          const dPersen = parseFloat(updatedRow.diskonPersen) || 0;
          updatedRow.diskonRupiah = dPersen > 0 ? String(Math.round((harga * dPersen / 100) * 100) / 100) : '';
        }
        const dRupiah = parseFloat(updatedRow.diskonRupiah) || 0;
        const hargaSetelahDiskon = harga - dRupiah;
        if (updatedRow.ppnPersen !== '') {
          const pPersen = parseFloat(updatedRow.ppnPersen) || 0;
          updatedRow.ppnRupiah = pPersen > 0 ? String(Math.round((hargaSetelahDiskon * pPersen / 100) * 100) / 100) : '';
        }
      }
      else if (field === 'diskonPersen') {
        if (value === '') {
          updatedRow.diskonRupiah = '';
        } else {
          const dPersen = parseFloat(value) || 0;
          updatedRow.diskonRupiah = String(Math.round((harga * dPersen / 100) * 100) / 100);
        }
        const dRupiah = parseFloat(updatedRow.diskonRupiah) || 0;
        const hargaSetelahDiskon = harga - dRupiah;
        if (updatedRow.ppnPersen !== '') {
          const pPersen = parseFloat(updatedRow.ppnPersen) || 0;
          updatedRow.ppnRupiah = pPersen > 0 ? String(Math.round((hargaSetelahDiskon * pPersen / 100) * 100) / 100) : '';
        }
      }
      else if (field === 'diskonRupiah') {
        if (value === '') {
          updatedRow.diskonPersen = '';
        } else {
          const dRupiah = parseFloat(value) || 0;
          updatedRow.diskonPersen = harga > 0 ? String(Math.round((dRupiah / harga * 100) * 100) / 100) : '0';
        }
        const dRupiah = parseFloat(updatedRow.diskonRupiah) || 0;
        const hargaSetelahDiskon = harga - dRupiah;
        if (updatedRow.ppnPersen !== '') {
          const pPersen = parseFloat(updatedRow.ppnPersen) || 0;
          updatedRow.ppnRupiah = pPersen > 0 ? String(Math.round((hargaSetelahDiskon * pPersen / 100) * 100) / 100) : '';
        }
      }
      else if (field === 'ppnPersen') {
        const dRupiah = parseFloat(updatedRow.diskonRupiah) || 0;
        const hargaSetelahDiskon = harga - dRupiah;
        if (value === '') {
          updatedRow.ppnRupiah = '';
        } else {
          const pPersen = parseFloat(value) || 0;
          updatedRow.ppnRupiah = String(Math.round((hargaSetelahDiskon * pPersen / 100) * 100) / 100);
        }
      }
      else if (field === 'ppnRupiah') {
        const dRupiah = parseFloat(updatedRow.diskonRupiah) || 0;
        const hargaSetelahDiskon = harga - dRupiah;
        if (value === '') {
          updatedRow.ppnPersen = '';
        } else {
          const pRupiah = parseFloat(value) || 0;
          updatedRow.ppnPersen = hargaSetelahDiskon > 0 ? String(Math.round((pRupiah / hargaSetelahDiskon * 100) * 100) / 100) : '0';
        }
      }

      return updatedRow;
    }));
  }, []);

  const handleDelete = useCallback((index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow()]);
  };

  const handleReset = () => {
    setRows([createEmptyRow()]);
  };

  const handleScannerSuccess = (parsedItems) => {
    const newRows = parsedItems.map(item => {
      const row = createEmptyRow();
      const harga = parseFloat(item.harga) || 0;
      row.harga = String(harga || '');
      row.qty = String(item.qty || '1');
      
      let dRupiah = parseFloat(item.diskonRupiah) || 0;
      let dPersen = parseFloat(item.diskonPersen) || 0;
      if (dPersen > 0 && dRupiah === 0) {
        dRupiah = (harga * dPersen) / 100;
      }
      row.diskonRupiah = dRupiah > 0 ? String(dRupiah) : '';
      row.diskonPersen = dPersen > 0 ? String(dPersen) : '';

      const hargaSetelahDiskon = harga - dRupiah;
      
      let pRupiah = parseFloat(item.ppnRupiah) || 0;
      let pPersen = parseFloat(item.ppnPersen) || 0;
      if (pPersen > 0 && pRupiah === 0) {
        pRupiah = (hargaSetelahDiskon * pPersen) / 100;
      }
      row.ppnRupiah = pRupiah > 0 ? String(pRupiah) : '';
      row.ppnPersen = pPersen > 0 ? String(pPersen) : '';
      
      return row;
    });

    setRows(prev => {
      // Jika baris pertama kosong (harga belum diisi), ganti saja dengan hasil scan
      if (prev.length === 1 && !prev[0].harga) {
        return newRows;
      }
      return [...prev, ...newRows];
    });
    setIsScannerOpen(false);
  };

  const calculations = rows.map((row) => calculateRow(row));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-300/30 dark:bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-300/30 dark:bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <Header
        onReset={handleReset}
        showInstallBtn={showInstallBtn}
        onInstall={handleInstallClick}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Page Title */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Kalkulator Harga{' '}
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              Bisnis
            </span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-500">
            Hitung harga modal, diskon, PPN, margin, dan dapatkan rekomendasi harga jual dari AI secara realtime.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 sm:space-y-4">
            {rows.map((row, idx) => (
              <CalculatorRow
                key={row.id}
                row={row}
                rowIndex={idx}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                isOnly={rows.length === 1}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200 text-sm font-semibold"
            >
              <Camera size={18} />
              Scan Nota AI
            </button>
            <button
              onClick={handleAddRow}
              className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-400 dark:hover:border-violet-500/40 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all duration-200 text-sm font-medium"
            >
              <Plus size={16} />
              Tambah Produk Manual
            </button>
          </div>

          <GrandTotal rows={rows} calculations={calculations} />
        </div>

        {/* Help Text */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 pb-6 text-xs text-slate-600">
          <span>Semua kalkulasi berjalan realtime</span>
          <span>·</span>
          <span>AI berbasis rule-based system</span>
        </div>
      </main>

      {/* Modern Premium Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-900/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl py-6 mt-12 transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-500 font-medium">
            Developed by <span className="bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent font-bold tracking-wide">ZUBED S.A.</span>
          </div>

          <a
            href="https://wa.me/6281717594886"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/35 transition-all duration-300 group shadow-lg shadow-emerald-950/20 active:scale-95 cursor-pointer"
          >
            {/* Custom SVG for official WhatsApp Icon */}
            <svg
              className="w-4 h-4 fill-current transition-transform duration-300 group-hover:scale-110 text-emerald-400"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Hubungi via WhatsApp</span>
          </a>
        </div>
      </footer>

      {/* Floating Calculator Button (FAB) */}
      <button
        onClick={() => setIsCalcOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white flex flex-col items-center justify-center shadow-lg shadow-violet-300 dark:shadow-violet-950/80 border border-violet-400/30 dark:border-violet-500/30 hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-500 dark:hover:to-purple-600 hover:scale-105 active:scale-95 transition-all duration-300 group cursor-pointer animate-bounce"
        style={{ animationDuration: '3s' }}
        title="Buka Kalkulator Standar (F1)"
      >
        <Calculator size={20} className="transition-transform duration-300 group-hover:rotate-12 mt-0.5" />
        <span className="text-[9px] font-bold text-violet-200 tracking-wider leading-none mt-1 uppercase">F1</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-400 animate-ping" />
      </button>

      {/* Standard Calculator Modal */}
      <StandardCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <ReceiptScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)}
        onSuccess={handleScannerSuccess}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
