import React from 'react';
import { formatCurrency } from '../utils/aiEngine';
import { TrendingUp, ShoppingCart, DollarSign, Percent } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 shadow-sm dark:shadow-none transition-colors duration-300`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function GrandTotal({ rows, calculations }) {
  const totalModal = calculations.reduce((sum, c) => sum + (c?.totalModal || 0), 0);
  const totalKeuntungan = calculations.reduce((sum, c, idx) => {
    const qty = parseFloat(rows[idx]?.qty) || 1;
    return sum + ((c?.keuntunganNominal || 0) * qty);
  }, 0);
  const totalHargaJual = calculations.reduce((sum, c, idx) => {
    const qty = parseFloat(rows[idx]?.qty) || 1;
    return sum + ((c?.hargaJualRec || 0) * qty);
  }, 0);

  const avgMargin = calculations.length > 0
    ? calculations.reduce((sum, c) => sum + (c?.keuntunganPersen || 0), 0) / calculations.filter(c => parseFloat(c?.hargaJualRec) > 0).length || 0
    : 0;

  const totalItems = rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 1), 0);

  return (
    <div className="mt-6 space-y-4">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Grand Total</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ShoppingCart}
          label="Total Modal"
          value={formatCurrency(totalModal)}
          color="bg-slate-100 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300"
        />
        <StatCard
          icon={DollarSign}
          label="Est. Total Jual"
          value={formatCurrency(totalHargaJual)}
          color="bg-violet-100 text-violet-600 dark:bg-violet-600/20 dark:text-violet-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Est. Keuntungan"
          value={formatCurrency(totalKeuntungan)}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400"
        />
        <StatCard
          icon={Percent}
          label="Avg. Margin"
          value={isNaN(avgMargin) ? '—' : `${avgMargin.toFixed(1)}%`}
          color="bg-amber-100 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400"
        />
      </div>

      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/30 shadow-sm dark:shadow-none transition-colors duration-300">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{rows.length}</span> produk ·{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> total qty
        </span>
        {totalModal > 0 && totalHargaJual > 0 && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ ROI estimasi {((totalKeuntungan / totalModal) * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
