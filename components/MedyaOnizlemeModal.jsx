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
  
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setTextContent('');
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

  const handleWheel = (e) => {
    if (!isImage) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
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

const getYoutubeEmbedUrl = () => {
  try {
    // Boşlukları temizle
    const trimmedUrl = activeModalUrl?.trim() || "";
    const url = new URL(trimmedUrl);
    let videoId = "";

    // 1. Durum: YouTube Shorts Kontrolü (youtube.com/shorts/VIDEO_ID)
    if (url.pathname.includes('/shorts/')) {
      // "/shorts/abc123xyz" -> ["", "shorts", "abc123xyz"] -> son elemanı alıyoruz
      videoId = url.pathname.split('/').pop();
    } 
    // 2. Durum: Kısaltılmış Link Kontrolü (youtu.be/VIDEO_ID)
    else if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.slice(1);
    } 
    // 3. Durum: Standart Web Linki Kontrolü (youtube.com/watch?v=VIDEO_ID)
    else {
      videoId = url.searchParams.get('v');
    }

    // Eğer bir video ID tespit edilebildiyse embed linkini dön, yoksa orijinal linki güvenli fallback bırak
    return videoId 
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1` 
      : trimmedUrl;

  } catch {
    // URL parse edilemezse (düz metinse vb.) çökmemesi için orijinal veriyi dön
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
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
            justifyContent: "center"
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
            /* 🚀 YENİLENMİŞ EVRENSEL GÖRÜNTÜLEYİCİ PANELİ: Hatasız, kaymasız ve scrollbar destekli yerel yapı */
            <div 
              className="w-full bg-white rounded-lg overflow-hidden"
              style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
            >
              {urlLower.endsWith('.pdf') ? (
                /* 🎯 PDF: Tarayıcının orijinal yerel PDF okuyucusunu çağırır. Kaydırma çubuğu kusursuz akar. */
                <iframe
                  src={`${activeModalUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0 bg-white"
                  style={{ height: "75vh", width: "100%" }}
                />
              ) : (
                /* 🎯 Word, Excel, PowerPoint: Microsoft Office Live resmi motoru. Yarım kalma veya kırılma yapmaz. */
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