import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import InputField from './InputField';
import AiInsightPanel from './AiInsightPanel';
import { calculateRow, generateInsights, formatCurrency } from '../utils/aiEngine';

function ResultBadge({ label, value, highlight = false }) {
  return (
    <div className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border ${highlight
      ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300'
      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40 text-slate-700 dark:text-slate-300'
      }`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
    </div>
  );
}

export default function CalculatorRow({ row, rowIndex, onUpdate, onDelete, isOnly }) {
  const [expanded, setExpanded] = useState(true);

  const calc = calculateRow(row);
  const insights = generateInsights(row, calc);

  const hasData = parseFloat(row.harga) > 0;

  const handleChange = (field) => (value) => {
    onUpdate(rowIndex, field, value);
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 transition-colors duration-300">
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center">
            <span className="text-xs md:text-sm font-bold text-violet-600 dark:text-violet-400">{rowIndex + 1}</span>
          </div>
          <div>
            <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">
              {parseFloat(row.harga) > 0
                ? formatCurrency(parseFloat(row.harga))
                : 'Produk ' + (rowIndex + 1)}
            </p>
            {hasData && (
              <div className="flex items-center gap-1.5 md:gap-3 text-xs text-slate-500 md:text-sm">
                <span>/pcs: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(calc.hargaPerQty)}</span></span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>Total: <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(calc.totalModal)}</span></span>
                <span className="text-slate-300 dark:text-slate-700 hidden md:inline">·</span>
                <span className="hidden md:inline">Jual (AI): <span className="font-medium text-violet-600 dark:text-violet-400">{formatCurrency(calc.hargaJualRec)}</span></span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {!isOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(rowIndex); }}
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
              title="Hapus baris"
            >
              <Trash2 size={16} />
            </button>
          )}
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-5 space-y-4 md:space-y-5 border-t border-slate-100 dark:border-slate-700/30 pt-4 md:pt-5 bg-slate-50/30 dark:bg-slate-900/40">
          {/* Input Fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 md:gap-4">
            <InputField
              label="Harga Modal"
              value={row.harga}
              onChange={handleChange('harga')}
              type="number"
              placeholder="0"
              prefix="Rp"
              className="col-span-2 lg:col-span-1"
            />
            <InputField
              label="Qty"
              value={row.qty}
              onChange={handleChange('qty')}
              type="number"
              placeholder="1"
            />
            <InputField
              label="Diskon (%)"
              value={row.diskonPersen}
              onChange={handleChange('diskonPersen')}
              type="number"
              placeholder="0"
              suffix="%"
            />
            <InputField
              label="Diskon (Rp)"
              value={row.diskonRupiah}
              onChange={handleChange('diskonRupiah')}
              type="number"
              placeholder="0"
              prefix="Rp"
            />
            <InputField
              label="PPN (%)"
              value={row.ppnPersen}
              onChange={handleChange('ppnPersen')}
              type="number"
              placeholder="0"
              suffix="%"
            />
            <InputField
              label="PPN (Rp)"
              value={row.ppnRupiah}
              onChange={handleChange('ppnRupiah')}
              type="number"
              placeholder="0"
              prefix="Rp"
            />
            <InputField
              label="Margin Ecer"
              value={row.marginTarget}
              onChange={handleChange('marginTarget')}
              type="number"
              placeholder="20"
              suffix="%"
            />
            <InputField
              label="Mrg Grosir 1"
              value={row.marginGrosir1}
              onChange={handleChange('marginGrosir1')}
              type="number"
              placeholder="15"
              suffix="%"
            />
            <InputField
              label="Mrg Grosir 2"
              value={row.marginGrosir2}
              onChange={handleChange('marginGrosir2')}
              type="number"
              placeholder="10"
              suffix="%"
            />
          </div>

          {/* Results */}
          {hasData && (
            <div className="space-y-2 pt-1 md:pt-2">
              <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hasil Kalkulasi</div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                <ResultBadge label="Harga/Qty (per pcs)" value={formatCurrency(calc.hargaPerQty)} />
                <ResultBadge label="Total Modal" value={formatCurrency(calc.totalModal)} />
                <ResultBadge label="Harga Ecer AI" value={formatCurrency(calc.hargaJualRec)} highlight />
                <ResultBadge label="Harga Grosir 1" value={formatCurrency(calc.hargaGrosir1)} />
                <ResultBadge label="Harga Grosir 2" value={formatCurrency(calc.hargaGrosir2)} />
                <ResultBadge label="Untung Ecer %" value={`${calc.keuntunganPersen.toFixed(1)}%`} />
                <ResultBadge label="Untung Ecer Rp" value={formatCurrency(calc.keuntunganNominal)} />
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="space-y-1.5 md:space-y-2 pt-1 md:pt-2">
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles size={12} className="text-violet-500" />
              Insight AI
            </div>
            <AiInsightPanel insights={insights} calc={calc} />
          </div>
        </div>
      )}
    </div>
  );
}
