/**
 * Utility to process receipt images using Gemini API (REST)
 */

export async function processReceiptImage(base64Image, apiKey) {
  if (!apiKey) {
    throw new Error('API Key tidak ditemukan.');
  }

  // Hapus prefix "data:image/jpeg;base64," atau sejenisnya
  const base64Data = base64Image.split(',')[1] || base64Image;

  const prompt = `Anda adalah sistem OCR cerdas untuk aplikasi kalkulator margin.
Saya akan memberikan foto nota/faktur/struk pembelian. 
Tugas Anda adalah mengekstrak semua baris produk yang ada di nota tersebut.
Untuk setiap produk, temukan:
- harga: Harga total untuk produk tersebut atau harga satuan (yang penting total modal). Kembalikan dalam angka (contoh: 150000).
- qty: Jumlah barang. Jika tidak tertulis, default 1.
- diskonRupiah: Jika ada diskon tertulis dalam nominal.
- diskonPersen: Jika ada diskon tertulis dalam persentase.
- ppnRupiah: Jika ada pajak/PPN untuk barang tersebut. (Opsional, 0 jika tidak ada)
- ppnPersen: Jika ada pajak/PPN persentase. (Opsional, 0 jika tidak ada)

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON ARRAY SEPERTI INI (TANPA MARKDOWN, TANPA TEKS LAIN):
[
  {
    "harga": 150000,
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
    const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
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
    }

    if (!selectedModel) {
       throw new Error(`API Key Anda tidak memiliki akses ke model Vision yang didukung. Model di akun Anda: ${availableModelsString || 'Gagal mengambil daftar model.'}`);
    }

    // Urutan prioritas model untuk dicoba (Fallback jika High Demand)
    const priorityQueue = [
      'models/gemini-3.5-flash',
      'models/gemini-2.5-flash',
      'models/gemini-2.0-flash',
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
          `https://generativelanguage.googleapis.com/v1/models/${cleanModelName}:generateContent?key=${apiKey}`,
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
        
        // Jika errornya high demand (503), lanjut ke model berikutnya di queue
        if (response.status === 503 || errorMessage.toLowerCase().includes('high demand') || errorMessage.toLowerCase().includes('overloaded')) {
          lastError = new Error(`Server Google penuh saat menggunakan ${cleanModelName}. Mencoba model alternatif...`);
          console.warn(lastError.message);
          continue; 
        }

        // Jika error lain (misal quota habis), lempar error langsung
        throw new Error(errorMessage);

      } catch (err) {
        lastError = err;
        // Jika ini bukan error high demand, jangan lanjut loop (misal no internet)
        if (!err.message.includes('Server Google penuh')) {
           break;
        }
      }
    }

    if (lastError && !response?.ok) {
      throw new Error(lastError.message.includes('Server Google penuh') 
        ? 'Semua server AI Google sedang sibuk (High Demand). Silakan coba lagi dalam beberapa menit.' 
        : lastError.message);
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
    throw error;
  }
}
