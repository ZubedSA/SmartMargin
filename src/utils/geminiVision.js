/**
 * Utility to process receipt images using Gemini API (REST)
 */

export async function processReceiptImage(base64Image, apiKey) {
  if (!apiKey) {
    throw new Error('API Key tidak ditemukan.');
  }

  // Bypass langsung ke OCR Offline jika API Key diset 'OFFLINE' atau 'KOSONG'
  if (apiKey.trim().toUpperCase() === 'OFFLINE') {
    return await fallbackTesseractOCR(base64Image);
  }

  // Hapus prefix "data:image/jpeg;base64," atau sejenisnya
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `Anda adalah sistem OCR cerdas untuk aplikasi kalkulator margin.
Saya akan memberikan foto nota/faktur/struk pembelian. 
Tugas Anda adalah mengekstrak semua baris produk yang ada di nota tersebut.
Untuk setiap produk fisik, temukan:
- hargaSatuan: Harga per 1 pcs (SATUAN) sebelum diskon/ppn. (angka)
- hargaTotal: Harga total untuk baris tersebut (hargaSatuan dikali qty) sebelum diskon/ppn. JIKA di nota hanya ada total, isi ke sini. (angka)
- qty: Jumlah barang. Jika tidak tertulis, default 1.
- diskonRupiah: Jika ada diskon tertulis dalam nominal untuk barang tersebut. (Opsional, 0 jika tidak ada)
- diskonPersen: Jika ada diskon tertulis dalam persentase. (Opsional, 0 jika tidak ada)
- ppnRupiah: Jika ada pajak/PPN nominal. (Opsional, 0 jika tidak ada)
- ppnPersen: Jika ada pajak/PPN persentase. (Opsional, 0 jika tidak ada)

INSTRUKSI KRITIKAL:
1. PPN GLOBAL: Jika nota memiliki total PPN di bagian bawah (misal PPN 11% atau nominal tertentu yang mengindikasikan pajak keseluruhan), WAJIB bagikan PPN tersebut ke SETIAP item. Isi \`ppnPersen\` (misal: 11) pada setiap baris item JSON. Jangan buat PPN sebagai item terpisah!
2. DISKON SEBAGAI ITEM NEGATIF: Jika ada baris diskon yang ditulis layaknya barang namun harganya negatif (misal: -39,810), JANGAN buat itu sebagai barang terpisah di JSON! Masukkan angka tersebut (dijadikan positif) ke kolom \`diskonRupiah\` pada barang tepat di atasnya.
3. Jangan pernah memasukkan 'PPN', 'Diskon', atau 'Total' sebagai entri barang (item). Output JSON murni berisi barang yang dibeli saja.

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON ARRAY SEPERTI INI (TANPA MARKDOWN, TANPA TEKS LAIN):
[
  {
    "hargaSatuan": 150000,
    "hargaTotal": 750000,
    "qty": 5,
    "diskonRupiah": 0,
    "diskonPersen": 0,
    "ppnRupiah": 0,
    "ppnPersen": 0
  }
]
Pastikan mengembalikan JSON mentah yang bisa diparse dengan JSON.parse().`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Asumsi kita mengirim jpeg
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
    }
  };

  try {
    // Cari model yang tersedia (Auto-Discovery)
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    let selectedModel = null;
    let availableModelsString = '';
    let availableModels = [];

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      availableModels = modelsData.models?.map(m => m.name) || [];
      availableModelsString = availableModels.join(', ');
      
      // Urutan prioritas model vision (Mendukung model tahun 2026)
      if (availableModels.includes('models/gemini-3.5-flash')) {
        selectedModel = 'gemini-3.5-flash';
      } else if (availableModels.includes('models/gemini-2.5-flash')) {
        selectedModel = 'gemini-2.5-flash';
      } else if (availableModels.includes('models/gemini-2.0-flash')) {
        selectedModel = 'gemini-2.0-flash';
      } else if (availableModels.includes('models/gemini-1.5-flash')) {
        selectedModel = 'gemini-1.5-flash';
      } else if (availableModels.includes('models/gemini-1.5-flash-latest')) {
        selectedModel = 'gemini-1.5-flash-latest';
      } else if (availableModels.includes('models/gemini-1.5-pro')) {
        selectedModel = 'gemini-1.5-pro';
      } else if (availableModels.includes('models/gemini-pro-vision')) {
        selectedModel = 'gemini-pro-vision';
      }
    } else {
      // Jika fetch daftar model gagal, mungkin karena quota 429 atau API key salah
      const errorData = await modelsResponse.json().catch(() => ({}));
      const errMsg = errorData.error?.message || `Gagal mengambil daftar model (HTTP ${modelsResponse.status}).`;
      
      if (modelsResponse.status === 429 || errMsg.toLowerCase().includes('quota')) {
         throw new Error('Kuota API Anda habis. Harap tunggu beberapa saat lalu coba lagi.');
      }
      throw new Error(`Koneksi ke Google API ditolak: ${errMsg}. Pastikan API Key benar dan masih aktif.`);
    }

    if (!selectedModel) {
       throw new Error(`API Key Anda tidak memiliki akses ke model Vision yang didukung. Model di akun Anda: ${availableModelsString || 'Kosong.'}`);
    }

    // Urutan prioritas model untuk dicoba (Fallback jika High Demand/Quota)
    const priorityQueue = [
      'models/gemini-3.5-flash',
      'models/gemini-2.5-flash',
      'models/gemini-2.0-flash',
      'models/gemini-2.0-flash-001',
      'models/gemini-2.0-flash-lite',
      'models/gemini-2.0-flash-lite-001',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-flash-latest',
      'models/gemini-1.5-pro'
    ].filter(m => availableModels.includes(m));

    if (priorityQueue.length === 0) {
      priorityQueue.push(selectedModel); // Fallback ke pilihan default jika aneh
    }

    let lastError = null;
    let response = null;

    // Coba model satu per satu dari yang terbaik
    for (const modelName of priorityQueue) {
      const cleanModelName = modelName.replace('models/', '');
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          lastError = null;
          break; // Berhasil, keluar dari loop
        }

        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Gagal terhubung ke API Gemini';
        
        // Jika errornya high demand (503), quota habis (429), ATAU model sudah dihapus Google (no longer available/not found)
        const isHighDemand = response.status === 503 || errorMessage.toLowerCase().includes('high demand') || errorMessage.toLowerCase().includes('overloaded');
        const isQuotaExceeded = response.status === 429 || errorMessage.toLowerCase().includes('quota exceeded');
        const isUnavailable = response.status === 404 || errorMessage.toLowerCase().includes('no longer available') || errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('deprecated');

        if (isQuotaExceeded) {
          lastError = new Error(`Model ${cleanModelName} gagal karena limit kuota. Langsung beralih ke offline agar cepat...`);
          console.warn(lastError.message);
          break; // Putus loop agar tidak menunggu 9 model gagal
        }

        if (isHighDemand || isUnavailable) {
          lastError = new Error(`Model ${cleanModelName} gagal (sibuk/tidak tersedia). Mencoba alternatif...`);
          console.warn(lastError.message);
          continue; 
        }

        // Jika error lain (misal quota habis), lempar error langsung
        throw new Error(errorMessage);

      } catch (err) {
        lastError = err;
        // Jika ini bukan error yang bisa diabaikan, jangan lanjut loop (misal no internet)
        if (!err.message.includes('Mencoba alternatif')) {
           break;
        }
      }
    }

    if (lastError && (!response || !response.ok)) {
      console.warn('Gemini API gagal total. Beralih ke Tesseract OCR Fallback...', lastError.message);
      return await fallbackTesseractOCR(base64Image);
    }

    const data = await response.json();
    const textResponse = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Bersihkan respon text (hilangkan markdown json jika ada)
    let cleanJson = textResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/m, '').replace(/```$/m, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/m, '').replace(/```$/m, '').trim();
    }

    try {
      const parsedData = JSON.parse(cleanJson);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (parseError) {
      console.error('Failed to parse JSON:', cleanJson);
      throw new Error('AI tidak merespon dalam format JSON yang benar.');
    }

  } catch (error) {
    console.error('Error processing receipt:', error);
    // Jika semua gagal (termasuk jaringan putus), coba Tesseract offline
    try {
      return await fallbackTesseractOCR(base64Image);
    } catch (fallbackErr) {
      throw new Error(`Sistem AI dan OCR Offline gagal: ${fallbackErr.message || 'Harap input manual.'}`);
    }
  }
}

/**
 * Fallback OCR menggunakan Tesseract.js langsung di browser
 * Berguna saat kuota API Google habis atau diblokir.
 */
async function fallbackTesseractOCR(base64Image) {
  return new Promise((resolve, reject) => {
    // Load script Tesseract.js secara dinamis dari CDN jika belum ada
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.onload = () => runTesseract(base64Image, resolve, reject);
      script.onerror = () => reject(new Error('Gagal memuat sistem OCR Offline.'));
      document.head.appendChild(script);
    } else {
      runTesseract(base64Image, resolve, reject);
    }
  });
}

async function runTesseract(base64Image, resolve, reject) {
  try {
    const { createWorker } = window.Tesseract;
    // Menggunakan bahasa Inggris yang lebih stabil untuk angka, atau gabungan 'eng+ind'
    const worker = await createWorker('eng'); 
    
    const { data: { text } } = await worker.recognize(base64Image);
    await worker.terminate();

    const items = parseReceiptText(text);
    if (items.length === 0) {
      // Jika tidak ada barang yang terdeteksi, lemparkan teks mentah agar pengguna tahu
      const cleanText = text.replace(/\\n/g, ' ').substring(0, 100);
      reject(new Error(`AI Offline gagal menemukan format harga. Teks terbaca: "${cleanText}..."`));
      return;
    }
    resolve(items);
  } catch (err) {
    console.error('Tesseract Error:', err);
    reject(err);
  }
}

function parseReceiptText(text) {
  const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  let globalPpnPersen = 0;

  // Coba cari PPN Global di baris bawah
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    if (upperLine.includes('PPN')) {
      const match = upperLine.match(/(\\d+)\\s*%/);
      if (match) {
        globalPpnPersen = parseInt(match[1]);
      } else if (upperLine.includes('11')) {
        globalPpnPersen = 11;
      }
    }
  }

  // Cari baris yang mirip item (ada angka di akhir)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    if (upperLine.includes('TOTAL') || upperLine.includes('SUB') || upperLine.includes('KEMBALI') || upperLine.includes('TUNAI') || upperLine.includes('PPN')) {
      continue;
    }

    // Ekstrak angka dari baris. Biasa struk: Nama 1 15.000 15.000
    // Ambil angka terakhir sebagai harga atau total
    const numbers = line.match(/-?\\d+[.,]?\\d*/g);
    if (numbers && numbers.length >= 1) {
      // Ambil angka terakhir sebagai harga, bersihkan titik/koma
      const lastNumStr = numbers[numbers.length - 1].replace(/[.,]/g, '');
      const lastNum = parseInt(lastNumStr, 10);

      if (!isNaN(lastNum) && lastNum > 100) { // Harga biasanya > 100 rupiah
        // Cek apakah baris ini diskon (angka negatif)
        if (lastNum < 0 || upperLine.includes('DISC')) {
          if (items.length > 0) {
            items[items.length - 1].diskonRupiah = (items[items.length - 1].diskonRupiah || 0) + Math.abs(lastNum);
          }
        } else {
          // Cari qty (biasanya angka kecil 1-100 sebelum harga)
          let qty = 1;
          if (numbers.length >= 2) {
            const potentialQtyStr = numbers[numbers.length - 2].replace(/[.,]/g, '');
            const potentialQty = parseInt(potentialQtyStr, 10);
            if (!isNaN(potentialQty) && potentialQty > 0 && potentialQty < 1000) {
              qty = potentialQty;
            }
          }
          
          let unitPrice = lastNum;
          if (qty > 1) {
            // Coba periksa apakah ada angka harga satuan tertulis di struk
            if (numbers.length >= 3) {
               const prevNumStr = numbers[numbers.length - 2 === numbers.indexOf(qty.toString()) ? numbers.length - 3 : numbers.length - 2].replace(/[.,]/g, '');
               const prevNum = parseInt(prevNumStr, 10);
               if (!isNaN(prevNum) && prevNum > 100 && Math.abs((prevNum * qty) - lastNum) <= 10) {
                 unitPrice = prevNum; // Menggunakan harga satuan eksplisit
               } else {
                 unitPrice = Math.round(lastNum / qty); // Derivasi harga satuan
               }
            } else {
               unitPrice = Math.round(lastNum / qty);
            }
          }

          items.push({
            harga: unitPrice, // Sekarang selalu memasukkan Harga Satuan (Unit Price)
            qty: qty,
            diskonRupiah: 0,
            diskonPersen: 0,
            ppnRupiah: 0,
            ppnPersen: globalPpnPersen
          });
        }
      }
    }
  }

  return items;
}
