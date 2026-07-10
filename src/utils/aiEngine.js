/**
 * Smart Rule-Based AI Engine
 * Menghasilkan rekomendasi harga jual dan insight bisnis
 */

/**
 * Menghitung semua kalkulasi untuk satu row
 * @param {Object} row - Data input row
 * @returns {Object} - Hasil kalkulasi lengkap
 */
export function calculateRow(row) {
  const harga = parseFloat(row.harga) || 0;
  const diskonPersen = parseFloat(row.diskonPersen) || 0;
  const diskonRupiah = parseFloat(row.diskonRupiah) || 0;
  const ppnPersen = parseFloat(row.ppnPersen) || 0;
  const ppnRupiah = parseFloat(row.ppnRupiah) || 0;
  const qty = parseFloat(row.qty) || 1;
  const marginTarget = parseFloat(row.marginTarget) || 0;
  const marginGrosir1 = parseFloat(row.marginGrosir1) || 0;
  const marginGrosir2 = parseFloat(row.marginGrosir2) || 0;
  const isTotalMode = row.isTotalMode === true;

  // 1. Total harga awal (sebelum diskon)
  const totalHargaAwal = isTotalMode ? harga : (harga * qty);

  // 2. Harga setelah diskon
  const hargaSetelahDiskon = totalHargaAwal - diskonRupiah;

  // 3. Hitung PPN — diterapkan ke harga setelah diskon
  const ppnNominal = ppnRupiah;

  // 4. Total modal = harga setelah diskon + PPN
  const totalModal = hargaSetelahDiskon + ppnNominal;

  // 5. Harga efektif per pcs (Modal Satuan Akhir)
  const hargaPerQty = qty > 0 ? totalModal / qty : 0;

  // Alias untuk kompatibilitas
  const hargaModalPerUnit = hargaPerQty;

  // 5. AI Harga Jual Rekomendasi (per unit)
  let hargaJualRec = 0;
  let keuntunganPersen = 0;
  let keuntunganNominal = 0;

  if (hargaPerQty > 0) {
    const targetMrg = marginTarget > 0 ? marginTarget : 20; // default 20%
    hargaJualRec = hargaPerQty * (1 + targetMrg / 100);
    // Untung per pcs = harga jual per pcs - harga modal per pcs
    keuntunganNominal = hargaJualRec - hargaPerQty;
    keuntunganPersen = hargaPerQty > 0 ? (keuntunganNominal / hargaPerQty) * 100 : 0;
  }

  // 6. Harga Grosir 1 & 2
  let hargaGrosir1 = 0;
  let hargaGrosir2 = 0;
  if (hargaPerQty > 0) {
    const targetGr1 = marginGrosir1 > 0 ? marginGrosir1 : 15;
    const targetGr2 = marginGrosir2 > 0 ? marginGrosir2 : 10;
    hargaGrosir1 = hargaPerQty * (1 + targetGr1 / 100);
    hargaGrosir2 = hargaPerQty * (1 + targetGr2 / 100);
  }

  return {
    hargaSetelahDiskon,
    ppnNominal,
    hargaModalPerUnit,
    hargaPerQty,
    totalModal,
    hargaJualRec,
    hargaGrosir1,
    hargaGrosir2,
    keuntunganPersen,
    keuntunganNominal,
  };
}

/**
 * AI Rule-Based Insight Generator
 * @param {Object} row - Input row
 * @param {Object} calc - Hasil kalkulasi
 * @returns {Array} - Array of insight strings dengan level (info|warning|danger|success)
 */
export function generateInsights(row, calc) {
  const insights = [];

  const diskonPersen = parseFloat(row.diskonPersen) || 0;
  const marginTarget = parseFloat(row.marginTarget) || 0;
  const marginGrosir2 = parseFloat(row.marginGrosir2) || 0;
  const ppnPersen = parseFloat(row.ppnPersen) || 0;
  const harga = parseFloat(row.harga) || 0;
  const qty = parseFloat(row.qty) || 1;

  if (harga === 0) {
    return [{ text: 'Masukkan harga modal untuk mendapatkan rekomendasi AI.', level: 'info' }];
  }

  // Analisis diskon
  if (diskonPersen >= 50) {
    insights.push({ text: `⚠️ Diskon sangat besar (${diskonPersen}%), risiko rugi tinggi!`, level: 'danger' });
  } else if (diskonPersen >= 30) {
    insights.push({ text: `⚠️ Diskon besar (${diskonPersen}%), periksa kembali margin Anda.`, level: 'warning' });
  } else if (diskonPersen > 0 && diskonPersen < 15) {
    insights.push({ text: `✅ Diskon ${diskonPersen}% masih wajar.`, level: 'success' });
  } else if (diskonPersen >= 15 && diskonPersen < 30) {
    insights.push({ text: `⚡ Diskon ${diskonPersen}%, margin perlu diperhatikan.`, level: 'warning' });
  }

  // Analisis PPN vs Margin
  if (ppnPersen > 0 && marginTarget > 0 && ppnPersen >= marginTarget * 0.7) {
    insights.push({ text: `⚠️ PPN ${ppnPersen.toFixed(1)}% cukup tinggi dibanding target margin ${marginTarget}%.`, level: 'warning' });
  } else if (ppnPersen > 0) {
    insights.push({ text: `📋 PPN diterapkan (${ppnPersen.toFixed(1)}%) sudah dikalkulasi dalam modal.`, level: 'info' });
  }

  // Analisis margin target
  if (marginTarget === 0) {
    insights.push({ text: '💡 Margin target belum diisi, AI menggunakan default 20%.', level: 'info' });
  } else if (marginTarget < 10) {
    insights.push({ text: `❌ Margin target ${marginTarget}% sangat rendah. Disarankan minimal 15-20%.`, level: 'danger' });
  } else if (marginTarget < 15) {
    insights.push({ text: `⚠️ Margin ${marginTarget}% terbilang tipis untuk bisnis retail.`, level: 'warning' });
  } else if (marginTarget >= 15 && marginTarget <= 35) {
    insights.push({ text: `✅ Margin ${marginTarget}% tergolong sehat dan kompetitif.`, level: 'success' });
  } else if (marginTarget > 35 && marginTarget <= 60) {
    insights.push({ text: `💰 Margin ${marginTarget}% tinggi, pastikan harga jual tetap kompetitif.`, level: 'info' });
  } else if (marginTarget > 60) {
    insights.push({ text: `🚀 Margin ${marginTarget}% sangat tinggi. Waspadai daya saing harga pasar.`, level: 'warning' });
  }

  // Analisis Margin Grosir
  if (marginGrosir2 > 0 && marginGrosir2 < 5) {
    insights.push({ text: `⚠️ Margin Grosir 2 sangat tipis (${marginGrosir2}%), pastikan perputaran volume cukup besar.`, level: 'warning' });
  }

  // Rekomendasi harga jual
  if (calc.hargaJualRec > 0) {
    insights.push({
      text: `💡 Harga jual disarankan: ${formatCurrency(calc.hargaJualRec)} per unit.`,
      level: 'success',
    });
  }

  // Estimasi keuntungan
  if (calc.keuntunganNominal > 0) {
    insights.push({
      text: `📈 Estimasi keuntungan total: ${formatCurrency(calc.keuntunganNominal * qty)} (${calc.keuntunganPersen.toFixed(1)}%) untuk ${qty} pcs.`,
      level: 'success',
    });
  }

  // Analisis qty besar
  if (qty >= 100) {
    insights.push({ text: `📦 Qty besar (${qty} pcs) — pertimbangkan nego diskon dari supplier.`, level: 'info' });
  }

  return insights.length > 0
    ? insights
    : [{ text: '✅ Semua parameter terlihat baik. Margin aman untuk penjualan.', level: 'success' }];
}

/**
 * Format angka ke format mata uang Rupiah
 */
export function formatCurrency(value) {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format angka dengan separator ribuan
 */
export function formatNumber(value) {
  if (!value && value !== 0) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}
