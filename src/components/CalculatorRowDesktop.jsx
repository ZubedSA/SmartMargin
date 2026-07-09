import React, { useState } from 'react';
import { Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import AiInsightPanel from './AiInsightPanel';
import { calculateRow, generateInsights, formatCurrency } from '../utils/aiEngine';

function TableInput({ value, onChange, type = 'text', placeholder = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-center
        placeholder:text-slate-400 dark:placeholder:text-slate-600
        focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
        rounded-lg px-2 py-2 transition-all duration-150
        hover:bg-slate-50 dark:hover:bg-slate-700/20
      "
    />
  );
}

function ResultCell({ value, highlight = false, accent = false, small = false }) {
  return (
    <div className={`text-center font-semibold ${small ? 'text-xs' : 'text-sm'} ${
      highlight ? 'text-violet-600 dark:text-violet-300' : accent ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'
    }`}>
      {value}
    </div>
  );
}

export default function CalculatorRowDesktop({ row, rowIndex, onUpdate, onDelete, isOnly }) {
  const [insightOpen, setInsightOpen] = useState(false);

  const calc = calculateRow(row);
  const insights = generateInsights(row, calc);
  const hasData = parseFloat(row.harga) > 0;

  const handleChange = (field) => (value) => {
    onUpdate(rowIndex, field, value);
  };

  const dangerCount = insights.filter(i => i.level === 'danger').length;
  const warningCount = insights.filter(i => i.level === 'warning').length;

  return (
    <>
      <tr className="group border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-150">
        {/* Row Number */}
        <td className="py-2 px-3 w-10 text-center">
          <span className="w-6 h-6 inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
            {rowIndex + 1}
          </span>
        </td>

        {/* Harga Modal */}
        <td className="py-2 px-1 min-w-[130px]">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium pointer-events-none">Rp</span>
            <input
              type="number"
              value={row.harga}
              onChange={(e) => handleChange('harga')(e.target.value)}
              placeholder="0"
              className="
                w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-right
                placeholder:text-slate-400 dark:placeholder:text-slate-600 pl-7 pr-2 py-2 rounded-lg
                focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
                hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all duration-150
              "
            />
          </div>
        </td>

        {/* Qty */}
        <td className="py-2 px-1 min-w-[80px]">
          <TableInput
            type="number"
            value={row.qty}
            onChange={handleChange('qty')}
            placeholder="1"
          />
        </td>

        {/* Diskon */}
        <td className="py-2 px-1 min-w-[190px]">
          <div className="flex items-center gap-1.5">
            {/* Diskon % */}
            <div className="relative flex-1 min-w-[65px]">
              <input
                type="number"
                value={row.diskonPersen}
                onChange={(e) => handleChange('diskonPersen')(e.target.value)}
                placeholder="0"
                className="
                  w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-center pr-4 py-2 rounded-lg
                  focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
                  hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">%</span>
            </div>
            
            <span className="text-slate-300 dark:text-slate-700 text-xs select-none">|</span>
            
            {/* Diskon Rp */}
            <div className="relative flex-[1.4] min-w-[100px]">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-semibold pointer-events-none">Rp</span>
              <input
                type="number"
                value={row.diskonRupiah}
                onChange={(e) => handleChange('diskonRupiah')(e.target.value)}
                placeholder="0"
                className="
                  w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-right pl-6 pr-1.5 py-2 rounded-lg
                  focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
                  hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </div>
        </td>

        {/* PPN */}
        <td className="py-2 px-1 min-w-[190px]">
          <div className="flex items-center gap-1.5">
            {/* PPN % */}
            <div className="relative flex-1 min-w-[65px]">
              <input
                type="number"
                value={row.ppnPersen}
                onChange={(e) => handleChange('ppnPersen')(e.target.value)}
                placeholder="0"
                className="
                  w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-center pr-4 py-2 rounded-lg
                  focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
                  hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">%</span>
            </div>
            
            <span className="text-slate-300 dark:text-slate-700 text-xs select-none">|</span>
            
            {/* PPN Rp */}
            <div className="relative flex-[1.4] min-w-[100px]">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-semibold pointer-events-none">Rp</span>
              <input
                type="number"
                value={row.ppnRupiah}
                onChange={(e) => handleChange('ppnRupiah')(e.target.value)}
                placeholder="0"
                className="
                  w-full bg-transparent text-slate-900 dark:text-white text-sm font-medium text-right pl-6 pr-1.5 py-2 rounded-lg
                  focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700/40 focus:ring-1 focus:ring-violet-400 dark:focus:ring-violet-500/50
                  hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
            </div>
          </div>
        </td>

        {/* Margin Target */}
        <td className="py-2 px-1 min-w-[100px]">
          <div className="relative">
            <TableInput
              type="number"
              value={row.marginTarget}
              onChange={handleChange('marginTarget')}
              placeholder="20"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">%</span>
          </div>
        </td>

        {/* Harga / Qty */}
        <td className="py-2 px-3 min-w-[120px]">
          <ResultCell value={hasData ? formatCurrency(calc.hargaPerQty) : '—'} accent />
        </td>

        {/* Total Modal */}
        <td className="py-2 px-3 min-w-[130px]">
          <ResultCell value={hasData ? formatCurrency(calc.totalModal) : '—'} />
        </td>

        {/* Harga Jual AI */}
        <td className="py-2 px-3 min-w-[130px]">
          <ResultCell value={hasData ? formatCurrency(calc.hargaJualRec) : '—'} highlight />
        </td>

        {/* Keuntungan % */}
        <td className="py-2 px-3 min-w-[90px]">
          <ResultCell
            value={hasData ? `${calc.keuntunganPersen.toFixed(1)}%` : '—'}
            small
          />
        </td>

        {/* Keuntungan Rp */}
        <td className="py-2 px-3 min-w-[120px]">
          <ResultCell
            value={hasData ? formatCurrency(calc.keuntunganNominal) : '—'}
            small
          />
        </td>

        {/* AI Insight Toggle */}
        <td className="py-2 px-2 min-w-[80px] text-center">
          <button
            onClick={() => setInsightOpen(!insightOpen)}
            className={`
              inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${dangerCount > 0
                ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                : warningCount > 0
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }
            `}
          >
            <Sparkles size={11} />
            AI
            {insightOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </td>

        {/* Delete */}
        <td className="py-2 px-2 text-center">
          {!isOnly && (
            <button
              onClick={() => onDelete(rowIndex)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          )}
        </td>
      </tr>

      {/* AI Insight Row */}
      {insightOpen && (
        <tr className="border-b border-slate-200 dark:border-slate-800/40">
          <td colSpan={13} className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="max-w-3xl">
              <AiInsightPanel insights={insights} calc={calc} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
