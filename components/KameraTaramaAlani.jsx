"use client";

import React, { useRef, useEffect } from 'react';

export default function KameraTaramaAlani({ isCameraOpen, ocrLoading, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const kutuRef = useRef(null); // Otomatik odaklanma için kapsayıcı ref'i

  // Fare tarama alanının üzerine geldiğinde odağı zorla buraya çekiyoruz (Yapıştırma / Paste süzgeci için)
  const handleMouseEnter = () => {
    if (kutuRef.current) {
      kutuRef.current.focus();
    }
  };

  // Kamera açıldığında akışı başlat, kapandığında kamerayı kapat (Memory leak engeller)
  useEffect(() => {
    async function kamerayiAc() {
      if (isCameraOpen) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }, // Mobil cihazlarda arka kamerayı öncelikli yapar
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (err) {
          console.error("Kamera açılırken hata oluştu:", err);
          alert("Kameraya erişim sağlanamadı. Lütfen izinleri kontrol edin.");
        }
      }
    }

    kamerayiAc();

    // Cleanup: Bileşen kapandığında kamerayı kapatır (Açık kalıp şarjı bitirmesin)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOpen]);

  // Fotoğrafı yakalayıp ana sayfadaki OCR fonksiyonuna gönderen köprü
const handleYakala = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const cropHeight = vHeight * 0.10;
    const yOffset = (vHeight - cropHeight) / 2;

    canvas.width = vWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    
    // Görüntüyü işle
    ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)';
    ctx.drawImage(video, 0, yOffset, vWidth, cropHeight, 0, 0, vWidth, cropHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Sadece yakalanan veriyi gönder, temizleme işlemini parent (üst) bileşende yap
    if (typeof onCapture === 'function') {
      onCapture(dataUrl);
    }
  };

const normalizePhoneNumber = (rawText) => {
  // 1. Sadece rakamları tut, diğer her şeyi (boşluk, +, -, vs.) sil
  let clean = rawText.replace(/\D/g, '');

  // 2. Eğer 12 haneliyse ve 90 ile başlıyorsa (905...)
  if (clean.length === 12 && clean.startsWith('90')) {
    clean = '0' + clean.slice(2); // Başına 0 ekle, 90'ı at
  }
  
  // 3. Eğer 11 haneliyse ve 90 ile başlıyorsa (905...)
  if (clean.length === 11 && clean.startsWith('90')) {
    clean = '0' + clean.slice(2);
  }

  // 4. Eğer 10 haneliyse (531...) başına 0 ekle (Türkiye formatı)
  if (clean.length === 10) {
    clean = '0' + clean;
  }

  return clean; // Çıktı: 05312084897
};

// Ana sayfadaki (Parent) kullanım:
const handleCaptureResult = (dataUrl) => {
  // OCR işlemini burada yapıyorsunuz...
  const ocrResult = performOCR(dataUrl); 
  
  // Temizlenmiş ve standartlaştırılmış numara:
  const finalNumber = normalizePhoneNumber(ocrResult);
  
  // Şimdi bu finalNumber ile veritabanında arama yapın
  aramaYap(finalNumber);
};


  if (!isCameraOpen) return null;

  return (
    <div
      ref={kutuRef}
      tabIndex={0} // Elementin klavye/fare ile odaklanabilir olmasını sağlar
      onMouseEnter={handleMouseEnter} // Fare üzerine geldiği an odak kilitlenir
      className="mt-2 bg-gray-950 p-2 rounded-xl border border-gray-700 flex flex-col items-center outline-none focus:ring-1 focus:ring-emerald-500/20"
    >
      {/* İnce Şerit Kamera Önizleme Alanı */}
      <div className="relative w-full max-w-md aspect-[4/1] h-10 bg-black rounded-lg overflow-hidden border border-gray-600 shadow-inner">
<video
  ref={videoRef}
  autoPlay
  playsInline
  muted
  className="w-full h-full object-cover object-center" // 'object-center' burada çok önemli
/>

        {/* İnce açılı yeni tarama hedef çizgisi */}
        <div className="absolute inset-0 border-2 border-emerald-500/30 bg-emerald-500/5 pointer-events-none flex items-center justify-center">
          {/* Ortadaki yeşil lazer çizgisi efekti */}
          <div className="w-full h-[1px] bg-emerald-400 opacity-70 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
      </div>

      {/* Gizli Canvas (Arka planda resmi yakalamak için kullanılır) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Tetikleyici Buton */}
      <button
        type="button"
        disabled={ocrLoading}
        onClick={handleYakala}
        className="mt-2 w-full max-w-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 text-gray-900 font-bold p-2 rounded-lg transition text-center shadow font-sans uppercase tracking-wide text-sm"
      >
        {ocrLoading ? '⚡ Numara Süzülüyor...' : 'Yakala ve Ara'}
      </button>
    </div>
  );
}