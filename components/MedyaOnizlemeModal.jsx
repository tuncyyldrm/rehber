"use client";

import React, { useEffect, useState, useRef } from 'react';

export default function MedyaOnizlemeModal({ 
  activeModalUrl, 
  setActiveModalUrl, 
  dosyaAdiniAyıkla, 
  dosyaIkonuVer 
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 📱 Mobil & Tablet İçin Ek Durumlar (Touch States)
  const [touchStartDist, setTouchStartDist] = useState(0);

  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setTextContent('');
    setTouchStartDist(0);
  }, [activeModalUrl]);

  useEffect(() => {
    if (!activeModalUrl) return;

    const urlLower = activeModalUrl.toLowerCase().split('?')[0];
    const isTextOrLog = urlLower.endsWith('.log') || urlLower.endsWith('.txt');

    if (isTextOrLog) {
      setTextLoading(true);
      fetch(activeModalUrl)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.text();
        })
        .then(data => {
          setTextContent(data);
          setTextLoading(false);
        })
        .catch(() => {
          setTextContent("Dosya içeriği okunurken bir hata oluştu.");
          setTextLoading(false);
        });
    }
  }, [activeModalUrl]);

  useEffect(() => {
    if (activeModalUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModalUrl(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalUrl, setActiveModalUrl]);

  if (!activeModalUrl) return null;

  const urlLower = activeModalUrl.toLowerCase().split('?')[0];
  const isYoutube = activeModalUrl.includes('youtube.com') || activeModalUrl.includes('youtu.be');

  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'avif', 'ico', 'heic'].some(ext => urlLower.endsWith(ext));
  const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].some(ext => urlLower.endsWith(ext));
  const isLogOrTxt = urlLower.endsWith('.log') || urlLower.endsWith('.txt');
  const isUniversalDoc = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'csv', 'odt', 'ods'].some(ext => urlLower.endsWith(ext));

  // ==========================================
  // 💻 MASAÜSTÜ KONTROLLERİ (MOUSE & WHEEL)
  // ==========================================
  const handleWheel = (e) => {
    if (!isImage) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(prevZoom => Math.max(0.5, Math.min(4, prevZoom + zoomFactor)));
  };

  const handleMouseDown = (e) => {
    if (!isImage || zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ==========================================
  // 📱 MOBİL & TABLET KONTROLLERİ (TOUCH)
  // ==========================================
  const handleTouchStart = (e) => {
    if (!isImage) return;

    if (e.touches.length === 1) {
      // ☝️ Tek parmak: Sürükleme / Kaydırma başlangıcı (Yalnızca büyütülmüşse)
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ 
          x: e.touches[0].clientX - position.x, 
          y: e.touches[0].clientY - position.y 
        });
      }
    } else if (e.touches.length === 2) {
      // ✌️ Çift parmak: Pinch-to-zoom (Yakınlaştırma) başlangıcı
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e) => {
    if (!isImage) return;

    if (e.touches.length === 1 && isDragging) {
      // ☝️ Tek parmak ile resmi kaydırma
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchStartDist > 0) {
      // ✌️ Çift parmak ile kıstırarak büyütme/küçültme
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      // Mesafe değişim oranını bulup zoom değerini hesaplıyoruz
      const factor = dist / touchStartDist;
      setTouchStartDist(dist);
      setZoom(prevZoom => Math.max(0.5, Math.min(4, prevZoom * factor)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(0);
  };

  const getYoutubeEmbedUrl = () => {
    try {
      const trimmedUrl = activeModalUrl?.trim() || "";
      const url = new URL(trimmedUrl);
      let videoId = "";

      if (url.pathname.includes('/shorts/')) {
        videoId = url.pathname.split('/').pop();
      } 
      else if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } 
      else {
        videoId = url.searchParams.get('v');
      }

      return videoId 
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1` 
        : trimmedUrl;
    } catch {
      return activeModalUrl;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col p-4 animate-fadeIn select-none"
      onClick={() => setActiveModalUrl(null)}
    >
      {/* Üst Bar */}
      <div 
        className="flex justify-between items-center bg-gray-900/80 p-3 rounded-lg border border-gray-800 w-full max-w-5xl mx-auto mb-2 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-xs font-mono text-gray-300 truncate max-w-[50%]">
          {dosyaAdiniAyıkla ? dosyaAdiniAyıkla(activeModalUrl) : 'Dosya Önizleme'}
        </span>
        
        <div className="flex gap-2 items-center">
          {isImage && (
            <div className="flex items-center bg-gray-800 rounded border border-gray-700 overflow-hidden text-white mr-1">
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="px-3 py-1 hover:bg-gray-700 font-bold text-xs border-r border-gray-700">-</button>
              <span className="text-[10px] font-mono px-2 min-w-[42px] text-center">%{Math.round(zoom * 100)}</span>
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} className="px-3 py-1 hover:bg-gray-700 font-bold text-xs">+</button>
              {zoom !== 1 && (
                <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }} className="bg-amber-600 hover:bg-amber-500 text-[9px] font-bold px-2 py-1">SIFIRLA</button>
              )}
            </div>
          )}

          <a href={activeModalUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded" onClick={e => e.stopPropagation()}>
            {isYoutube ? 'YT AÇ' : 'İNDİR'}
          </a>
          <button onClick={() => setActiveModalUrl(null)} className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold px-3 py-1.5 rounded border border-gray-700">KAPAT</button>
        </div>
      </div>

      {/* İçerik Alanı */}
      <div 
        className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden bg-gray-950 rounded-xl border border-gray-800 relative"
        onClick={e => e.stopPropagation()}
        
        // Masaüstü Dinleyicileri
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        
        // 🚀 Mobil & Tablet Dokunmatik Dinleyicileri (Yeni Eklendi)
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div 
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center p-4 ease-out ${
            isDragging ? 'cursor-grabbing' : (zoom > 1 && isImage) ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{ 
            transform: isImage ? `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)` : 'none',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            touchAction: isImage ? "none" : "auto" // Tarayıcının varsayılan sayfa kaydırma hareketini resim üzerinde engeller
          }}
        >
          {isYoutube ? (
            <iframe src={getYoutubeEmbedUrl()} className="w-full h-full max-h-[75vh] aspect-video border-0 rounded-lg" allowFullScreen />
          ) : isImage ? (
            <img src={activeModalUrl} alt="Önizleme" className="max-w-full max-h-[75vh] object-contain pointer-events-none drop-shadow-2xl" />
          ) : isVideo ? (
            <video src={activeModalUrl} controls autoPlay className="w-full max-h-[75vh] rounded-lg bg-black" />
          ) : isLogOrTxt ? (
            <div className="w-full h-full max-h-[75vh] bg-gray-900 border border-gray-800 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-auto whitespace-pre select-text text-left shadow-inner border-t-4 border-t-emerald-600">
              {textLoading ? <div className="text-gray-400 animate-pulse">Dosya yükleniyor...</div> : <code>{textContent}</code>}
            </div>
          ) : isUniversalDoc ? (
            <div 
              className="w-full bg-white rounded-lg overflow-hidden"
              style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
            >
              {urlLower.endsWith('.pdf') ? (
                <iframe
                  src={`${activeModalUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0 bg-white"
                  style={{ height: "75vh", width: "100%" }}
                />
              ) : (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeModalUrl)}`}
                  className="w-full h-full border-0 bg-white"
                  style={{ height: "75vh", width: "100%" }}
                />
              )}
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="text-6xl mb-4">{typeof dosyaIkonuVer === 'function' ? dosyaIkonuVer(activeModalUrl) : '📁'}</div>
              <p className="text-gray-400 mb-4">Bu dosya formatı doğrudan önizlenemiyor.</p>
              <a href={activeModalUrl} download className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold">İndir</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}