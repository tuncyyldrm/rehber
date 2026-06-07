"use client";

import React from 'react';

export default function MedyaOnizlemeModal({ activeModalUrl, setActiveModalUrl, dosyaAdiniAyıkla, dosyaIkonuVer }) {
  if (!activeModalUrl) return null;

  // URL'in bir YouTube bağlantısı olup olmadığını tek bir yerden kontrol edelim
  const isYoutube = activeModalUrl.includes('youtube.com') || activeModalUrl.includes('youtu.be');

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex flex-col justify-between p-4 overscroll-none touch-none animate-fadeIn"
      onClick={() => {
        document.body.style.overflow = '';
        setActiveModalUrl(null);
      }}
      ref={(el) => {
        if (el) document.body.style.overflow = 'hidden';
      }}
    >
      {/* Üst Bar: Dosya Adı ve Kapat/İndir Butonları */}
      <div className="flex justify-between items-center bg-gray-900/80 p-3 rounded-lg border border-gray-800 backdrop-blur w-full max-w-5xl mx-auto mb-2 shrink-0">
        <span className="text-xs sm:text-sm font-mono text-gray-300 truncate max-w-[70%]">
          {isYoutube ? '🎬 YouTube Videosu' : `📄 ${dosyaAdiniAyıkla(activeModalUrl)}`}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={activeModalUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            🔗 {isYoutube ? "YouTube'da Aç" : '📥 İndir'}
          </a>
          <button
            type="button"
            onClick={() => {
              document.body.style.overflow = '';
              setActiveModalUrl(null);
            }}
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-3 py-1.5 rounded text-xs transition"
          >
            ✕ Kapat
          </button>
        </div>
      </div>

      {/* Orta Alan: Dinamik İçerik Gösterici */}
      <div
        className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden rounded-xl bg-gray-950 border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {isYoutube ? (
          <iframe
            src={(() => {
              let videoId = '';
              if (activeModalUrl.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(activeModalUrl.split('?')[1]);
                videoId = urlParams.get('v');
              } else if (activeModalUrl.includes('youtu.be/')) {
                videoId = activeModalUrl.split('youtu.be/')[1]?.split('?')[0];
              } else if (activeModalUrl.includes('youtube.com/embed/')) {
                return activeModalUrl;
              }
              return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : activeModalUrl;
            })()}
            title="YouTube Video Player"
            className="w-full h-full max-h-[75vh] aspect-video rounded-lg shadow-2xl border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : ['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => activeModalUrl.toLowerCase().split('?')[0].endsWith(ext)) ? (
          <img 
            src={activeModalUrl} 
            alt="Büyük Önizleme" 
            className="max-w-full max-h-[75vh] object-contain select-none shadow-2xl" 
          />
        ) : ['mp4', 'webm', 'ogg', 'mov'].some(ext => activeModalUrl.toLowerCase().split('?')[0].endsWith(ext)) ? (
          <video 
            src={activeModalUrl} 
            controls 
            autoPlay 
            playsInline 
            className="w-full h-full max-h-[75vh] rounded-lg shadow-2xl bg-black" 
          />
        ) : activeModalUrl.toLowerCase().split('?')[0].endsWith('pdf') ? (
          <iframe 
            src={activeModalUrl} 
            className="w-full h-full max-h-[75vh] bg-white rounded-lg border-0 touch-auto shadow-2xl" 
            title="PDF Doküman Önizleme" 
          />
        ) : ['txt', 'log', 'html', 'htm'].some(ext => activeModalUrl.toLowerCase().split('?')[0].endsWith(ext)) ? (
          <iframe 
            src={activeModalUrl} 
            className="w-full h-full max-h-[75vh] bg-gray-900 text-gray-100 p-3 font-mono border-0 touch-auto rounded-lg" 
            title="Metin Önizleme" 
          />
        ) : (
          /* DESTEKLENMEYEN FORMAT REZERV ALANI */
          <div className="text-center p-8 animate-fadeIn">
            <div className="text-5xl mb-3 select-none">
              {typeof dosyaIkonuVer === 'function' ? dosyaIkonuVer(activeModalUrl) : '📁'}
            </div>
            <p className="text-sm text-gray-400 mb-4">Bu dosya formatı tarayıcı içinde doğrudan önizlenemez.</p>
            <a 
              href={activeModalUrl} 
              download 
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-6 py-2 rounded-lg text-xs transition shadow-md"
            >
              📥 Dosyayı Cihaza İndir
            </a>
          </div>
        )}
      </div>

      {/* Alt Bar Bilgilendirme */}
      <div className="text-center text-[11px] text-gray-500 mt-2 pointer-events-none select-none">
        Kapatmak için dışarıdaki boş bir alana dokunabilirsiniz.
      </div>
    </div>
  );
}