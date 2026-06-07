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
    
    // 1. Kırpılmış Görüntü İçin Yeni Canvas
    const cropCanvas = document.createElement('canvas');
    
    // Videonun fiziksel çözünürlüğüne oranla bir kırpma alanı hesaplayalım
    // 4/1 oranında bir alanımız var, bu yüzden dikeyde videonun tam ortasından 
    // yaklaşık %20'lik bir şerit keseceğiz.
    const cropWidth = video.videoWidth;
    const cropHeight = video.videoHeight * 0.15; // Sadece orta %15'lik dikey alanı al
    const yOffset = (video.videoHeight - cropHeight) / 2; // Tam ortadan başlat

    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;

    const ctx = cropCanvas.getContext('2d');

    // 2. Sadece belirttiğimiz bölgeyi kopyala ve canvas'a çiz
    ctx.drawImage(
      video, 
      0, yOffset, cropWidth, cropHeight, // Kaynaktan al
      0, 0, cropWidth, cropHeight       // Yeni canvas'a çiz
    );

    // 3. Kırpılmış görüntüyü Base64'e çevir
    const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
    
    // 4. Ana sayfaya gönder
    if (typeof onCapture === 'function') {
      onCapture(dataUrl);
    }
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
          className="w-full h-full object-cover object-center"
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