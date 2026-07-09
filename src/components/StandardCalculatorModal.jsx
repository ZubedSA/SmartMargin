import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Delete, History, Trash2 } from 'lucide-react';

export default function StandardCalculatorModal({ isOpen, onClose }) {
  const [displayValue, setDisplayValue] = useState('0');
  const [equation, setEquation] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Safely evaluate math expression
  const calculateResult = useCallback((expr) => {
    try {
      // Replace display symbols with math symbols
      let sanitizedExpr = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Prevent division by zero or empty eval
      if (!sanitizedExpr.trim()) return 0;
      if (/\/0(?!\d)/.test(sanitizedExpr)) {
        return 'Error: Div by 0';
      }

      // Safe calculation using Function constructor
      // Since it is client-side mathematical expression, this is safe and simple
      const result = new Function(`return (${sanitizedExpr})`)();
      
      if (isNaN(result) || !isFinite(result)) {
        return 'Error';
      }

      // Round to 8 decimal places max to prevent float anomalies, and remove trailing zeros
      return parseFloat(Number(result).toFixed(8)).toString();
    } catch (e) {
      return 'Error';
    }
  }, []);

  const handleInput = useCallback((value) => {
    setDisplayValue((prev) => {
      if (prev === 'Error' || prev.startsWith('Error:')) {
        return value === '.' ? '0.' : value;
      }

      if (isFinished) {
        setIsFinished(false);
        setEquation('');
        return value === '.' ? '0.' : value;
      }

      if (waitingForOperand) {
        setWaitingForOperand(false);
        return value === '.' ? '0.' : value;
      }

      if (value === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      if (prev === '0') return value;
      return prev + value;
    });
  }, [isFinished, waitingForOperand]);

  const handleOperator = useCallback((op) => {
    if (displayValue === 'Error' || displayValue.startsWith('Error:')) return;

    if (isFinished) {
      setIsFinished(false);
      setEquation(`${displayValue} ${op}`);
      setWaitingForOperand(true);
      return;
    }

    if (waitingForOperand) {
      setEquation((prevEq) => {
        if (!prevEq) return prevEq;
        const trimmed = prevEq.trim();
        return trimmed.slice(0, -1) + op;
      });
      return;
    }

    setEquation((prevEq) => {
      const nextEq = prevEq ? `${prevEq} ${displayValue} ${op}` : `${displayValue} ${op}`;
      const exprToEval = prevEq ? `${prevEq} ${displayValue}` : displayValue;
      const intermediateResult = calculateResult(exprToEval);
      setDisplayValue(intermediateResult);
      return nextEq;
    });
    setWaitingForOperand(true);
  }, [displayValue, isFinished, waitingForOperand, calculateResult]);

  const handleEqual = useCallback(() => {
    if (!equation || waitingForOperand) return;
    
    const fullEquation = `${equation} ${displayValue}`;
    const result = calculateResult(fullEquation);
    
    setHistory((prev) => [...prev, { eq: fullEquation, result }]);
    
    setEquation('');
    setDisplayValue(result);
    setIsFinished(true);
    setWaitingForOperand(false);
  }, [equation, displayValue, waitingForOperand, calculateResult]);

  const handleClear = useCallback(() => {
    setDisplayValue('0');
    setEquation('');
    setIsFinished(false);
    setWaitingForOperand(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (waitingForOperand || isFinished) return;

    setDisplayValue((prev) => {
      if (prev === 'Error' || prev.startsWith('Error:') || prev.length <= 1) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [waitingForOperand, isFinished]);

  const handlePercentage = useCallback(() => {
    if (waitingForOperand) return;

    const val = parseFloat(displayValue);
    if (isNaN(val)) return;

    if (equation && !isFinished) {
      const parts = equation.trim().split(/\s+/);
      if (parts.length >= 2) {
        const lastOp = parts[parts.length - 1];
        const exprBeforeOp = parts.slice(0, -1).join(' ');
        const baseVal = parseFloat(calculateResult(exprBeforeOp));
        
        if (!isNaN(baseVal)) {
          if (lastOp === '+' || lastOp === '-') {
            const percentageVal = calculateResult(`${baseVal} * ${val} / 100`);
            const finalResult = calculateResult(`${exprBeforeOp} ${lastOp} ${percentageVal}`);
            
            const fullEquation = `${equation} ${val}%`;
            setHistory((prev) => [...prev, { eq: fullEquation, result: finalResult }]);
            
            setEquation('');
            setDisplayValue(finalResult);
            setIsFinished(true);
            setWaitingForOperand(false);
            return;
          } else if (['×', '÷', '*', '/'].includes(lastOp)) {
             const percentageVal = calculateResult(`${val} / 100`);
             const finalResult = calculateResult(`${exprBeforeOp} ${lastOp} ${percentageVal}`);
             
             const fullEquation = `${equation} ${val}%`;
             setHistory((prev) => [...prev, { eq: fullEquation, result: finalResult }]);
             
             setEquation('');
             setDisplayValue(finalResult);
             setIsFinished(true);
             setWaitingForOperand(false);
             return;
          }
        }
      }
    }

    const result = calculateResult(`${val} / 100`);
    if (isFinished) {
       const fullEquation = `${val}%`;
       setHistory((prev) => [...prev, { eq: fullEquation, result }]);
    }
    setDisplayValue(result);
  }, [displayValue, equation, waitingForOperand, isFinished, calculateResult]);

  const handleToggleSign = useCallback(() => {
    setDisplayValue((prev) => {
      if (prev === '0' || prev === 'Error') return prev;
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  }, []);

  // Copy result to clipboard
  const handleCopy = useCallback(() => {
    if (displayValue === 'Error' || displayValue.startsWith('Error:')) return;
    
    // Copy clean numeric value
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayValue]);

  // Keyboard Event Handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleInput(key);
      } else if (key === '.') {
        e.preventDefault();
        handleInput('.');
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          handleCopy();
        } else {
          handleClear();
        }
      } else if (key === '%') {
        e.preventDefault();
        handlePercentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleInput, handleOperator, handleEqual, handleBackspace, handleClear, handlePercentage, onClose, handleCopy]);

  if (!isOpen) return null;

  // Format display numbers with thousands separator for readability
  const formatDisplay = (val) => {
    if (val === 'Error' || val.startsWith('Error:')) return val;
    const parts = val.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    const formattedInt = new Intl.NumberFormat('id-ID').format(parseFloat(integerPart) || 0);
    // If it was negative or zero and parsed as zero, verify negative signs
    let result = formattedInt;
    if (integerPart === '-0') result = '-0';
    else if (integerPart === '-') result = '-';
    
    // Handle typing decimal numbers cleanly
    if (val.endsWith('.')) {
      return result + ',';
    }
    return decimalPart !== undefined ? result + ',' + decimalPart : result;
  };

  const padBtn = (label, onClick, type = 'number') => {
    let btnStyle = "h-14 sm:h-16 rounded-2xl flex items-center justify-center text-lg font-semibold transition-all duration-150 active:scale-95 cursor-pointer ";
    
    if (type === 'number') {
      btnStyle += "bg-slate-50 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800/70 dark:border-slate-700/30";
    } else if (type === 'operator') {
      btnStyle += "bg-violet-100 text-violet-600 hover:bg-violet-200 border border-violet-200 dark:bg-violet-600/25 dark:text-violet-400 dark:hover:bg-violet-600/40 dark:border-violet-500/20";
    } else if (type === 'equal') {
      btnStyle += "bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 text-white hover:from-violet-600 hover:to-purple-700 dark:hover:from-violet-500 dark:hover:to-purple-600 shadow-lg shadow-violet-200 dark:shadow-violet-950/40";
    } else if (type === 'special') {
      btnStyle += "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-900 dark:border-slate-800/40";
    }

    return (
      <button onClick={onClick} className={btnStyle}>
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      {/* Modal Card */}
      <div 
        className="w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/50 dark:shadow-black/80 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-300">Kalkulator Standar</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${showHistory ? 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/40' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
              title="Riwayat"
            >
              <History size={16} />
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col items-end justify-end min-h-[110px] border-b border-slate-200 dark:border-slate-800/30">
          {/* Equation history */}
          <div className="text-xs text-slate-500 font-medium tracking-wide h-5 truncate max-w-full">
            {equation}
          </div>
          {/* Active input display */}
          <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 truncate max-w-full font-mono">
            {formatDisplay(displayValue)}
          </div>
        </div>

        {/* Copy Result Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/30 flex items-center justify-between gap-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hasil Kalkulasi</span>
          <button
            onClick={handleCopy}
            disabled={displayValue === 'Error' || displayValue.startsWith('Error:')}
            title="Salin hasil ke clipboard (Ctrl+C)"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-95 cursor-pointer
              ${copied 
                ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/30 disabled:opacity-30 disabled:pointer-events-none'
              }
            `}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Tersalin!' : 'Salin Hasil'}</span>
          </button>
        </div>

        {/* Keypad Grid OR History Overlay */}
        <div className="relative">
          {showHistory && (
            <div className="absolute inset-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Riwayat Perhitungan</span>
                {history.length > 0 && (
                  <button 
                    onClick={() => setHistory([])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 pr-2 pb-2 scrollbar-thin">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2 opacity-60 pb-10">
                    <History size={32} />
                    <span className="text-sm font-medium">Belum ada riwayat</span>
                  </div>
                ) : (
                  history.slice().reverse().map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setDisplayValue(item.result);
                        setShowHistory(false);
                      }}
                      className="group flex flex-col items-end p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-all active:scale-95"
                    >
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{item.eq} =</span>
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {formatDisplay(item.result)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="p-5 grid grid-cols-4 gap-3 bg-white dark:bg-slate-900/30">
            {/* Row 1 */}
          {padBtn('C', handleClear, 'special')}
          {padBtn('+/-', handleToggleSign, 'special')}
          {padBtn('%', handlePercentage, 'special')}
          <button 
            onClick={handleBackspace} 
            className="h-14 sm:h-16 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/40 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Delete size={18} />
          </button>

          {/* Row 2 */}
          {padBtn('7', () => handleInput('7'))}
          {padBtn('8', () => handleInput('8'))}
          {padBtn('9', () => handleInput('9'))}
          {padBtn('÷', () => handleOperator('÷'), 'operator')}

          {/* Row 3 */}
          {padBtn('4', () => handleInput('4'))}
          {padBtn('5', () => handleInput('5'))}
          {padBtn('6', () => handleInput('6'))}
          {padBtn('×', () => handleOperator('×'), 'operator')}

          {/* Row 4 */}
          {padBtn('1', () => handleInput('1'))}
          {padBtn('2', () => handleInput('2'))}
          {padBtn('3', () => handleInput('3'))}
          {padBtn('-', () => handleOperator('-'), 'operator')}

          {/* Row 5 */}
          {padBtn('0', () => handleInput('0'))}
          {padBtn('.', () => handleInput('.'))}
          {padBtn('=', handleEqual, 'equal')}
          {padBtn('+', () => handleOperator('+'), 'operator')}
          </div>
        </div>

        {/* Symmetrical Bottom Shortcut Guide */}
        <div className="bg-slate-50 dark:bg-slate-950/30 border-t border-slate-200 dark:border-slate-800/40 px-5 py-2.5 flex items-center justify-center gap-3.5 select-none">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500 uppercase tracking-wider">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 text-[8px] font-bold font-mono">ESC</kbd>
            <span>Keluar</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 font-bold text-xs select-none">·</span>
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500 uppercase tracking-wider">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 text-[8px] font-bold font-mono">CTRL + C</kbd>
            <span>Salin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
