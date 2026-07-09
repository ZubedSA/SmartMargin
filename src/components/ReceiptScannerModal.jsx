import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { processReceiptImage } from '../utils/geminiVision';

export default function ReceiptScannerModal({ isOpen, onClose, onSuccess, onOpenSettings }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Bersihkan state jika ditutup
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setError(null);
      setIsProcessing(false);
      setIsCameraActive(false);
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkApiKey = () => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      setError('API Key belum diatur. Silakan isi di Pengaturan (Settings) terlebih dahulu.');
      return false;
    }
    return key;
  };

  const processImage = async (base64Image) => {
    const apiKey = checkApiKey();
    if (!apiKey) return;

    setIsProcessing(true);
    setError(null);

    try {
      const parsedItems = await processReceiptImage(base64Image, apiKey);
      if (parsedItems.length === 0) {
        throw new Error('Tidak ada data produk yang berhasil diekstrak dari gambar ini.');
      }
      onSuccess(parsedItems);
    } catch (err) {
      setError(err.message || 'Gagal memproses gambar. Pastikan gambar jelas dan merupakan nota/faktur.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tampilkan preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setImagePreview(base64);
      processImage(base64);
    };
    reader.onerror = () => {
      setError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: { files: [file] } });
      }
    }
  };

  const startCustomCamera = async () => {
    setError(null);
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setIsCameraActive(false);
      setError('Gagal mengakses kamera: ' + (err.message || 'Akses ditolak.'));
    }
  };

  const captureCustomPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      
      stopCamera();
      setIsCameraActive(false);
      setImagePreview(base64);
      processImage(base64);
    }
  };

  const cancelCustomCamera = () => {
    stopCamera();
    setIsCameraActive(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => !isProcessing && onClose()}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Scan Nota Otomatis</h2>
              <p className="text-xs text-slate-500">Ditenagai oleh AI Vision</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-4 flex gap-3 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Terjadi Kesalahan</p>
                <p>{error}</p>
                {error.includes('API Key') && (
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="mt-2 text-xs font-bold underline hover:text-red-800 dark:hover:text-red-300"
                  >
                    Buka Pengaturan API Key
                  </button>
                )}
              </div>
            </div>
          )}

          {isCameraActive ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={cancelCustomCamera}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={captureCustomPhoto}
                  className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
                >
                  <Camera size={18} />
                  Jepret Foto
                </button>
              </div>
              {/* Hidden canvas for capturing frame */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : !imagePreview ? (
            <>
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Upload size={28} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Klik untuk upload foto</p>
                  <p className="text-xs text-slate-500 mt-1">atau drag & drop gambar nota/faktur ke sini</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Atau</span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
              </div>

              <button 
                onClick={startCustomCamera}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Camera size={18} />
                Buka Kamera
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 max-h-64 flex justify-center">
                <img src={imagePreview} alt="Receipt Preview" className="max-h-64 object-contain" />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 animate-in fade-in">
                    <Loader2 size={32} className="animate-spin text-indigo-400" />
                    <p className="text-sm font-medium">AI sedang membaca nota...</p>
                  </div>
                )}
              </div>
              
              {!isProcessing && error && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setImagePreview(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Upload Ulang
                  </button>
                  <button
                    onClick={startCustomCamera}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <RefreshCw size={16} /> Coba Kamera
                  </button>
                </div>
              )}
            </div>
          )}

          <input 
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
