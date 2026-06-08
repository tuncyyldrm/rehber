"use client";

import React, { useEffect } from 'react';

export default function MedyaOnizlemeModal({ activeModalUrl, setActiveModalUrl, dosyaAdiniAyıkla, dosyaIkonuVer }) {
  
  // 1. Scroll Kilidi: useEffect ile temiz yönetilmeli
  useEffect(() => {
    if (activeModalUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }; // Cleanup
  }, [activeModalUrl]);

  if (!activeModalUrl) return null;

  const urlLower = activeModalUrl.toLowerCase().split('?')[0];
  const isYoutube = activeModalUrl.includes('youtube.com') || activeModalUrl.includes('youtu.be');

  // 2. YouTube ID Çıkarıcı
  const getYoutubeEmbedUrl = () => {
    if (activeModalUrl.includes('youtube.com/embed/')) return activeModalUrl;
    const videoId = activeModalUrl.includes('v=') 
      ? new URLSearchParams(activeModalUrl.split('?')[1]).get('v')
      : activeModalUrl.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  // 3. Dosya Tipini Belirle
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => urlLower.endsWith(ext));
  const isVideo = ['mp4', 'webm', 'ogg', 'mov'].some(ext => urlLower.endsWith(ext));
  const isDoc = ['pdf', 'txt', 'docx', 'doc', 'xlsx', 'pptx', 'html', 'htm'].some(ext => urlLower.endsWith(ext));

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col p-4 animate-fadeIn"
      onClick={() => setActiveModalUrl(null)}
    >
      {/* Üst Bar */}
      <div className="flex justify-between items-center bg-gray-900/80 p-3 rounded-lg border border-gray-800 w-full max-w-5xl mx-auto mb-2 shrink-0">
        <span className="text-xs font-mono text-gray-300 truncate max-w-[60%]">
          {dosyaAdiniAyıkla ? dosyaAdiniAyıkla(activeModalUrl) : 'Dosya Önizleme'}
        </span>
        <div className="flex gap-2">
          <a href={activeModalUrl} target="_blank" rel="noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded" onClick={e => e.stopPropagation()}>
            {isYoutube ? 'YT AÇ' : 'İNDİR'}
          </a>
          <button onClick={() => setActiveModalUrl(null)} className="bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold px-3 py-1 rounded">KAPAT</button>
        </div>
      </div>

      {/* İçerik Alanı */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex items-center justify-center overflow-hidden bg-gray-950 rounded-xl border border-gray-800" onClick={e => e.stopPropagation()}>
        {isYoutube ? (
          <iframe src={getYoutubeEmbedUrl()} className="w-full h-full max-h-[75vh] aspect-video border-0" allowFullScreen />
        ) : isImage ? (
          <img src={activeModalUrl} className="max-w-full max-h-[75vh] object-contain" />
        ) : isVideo ? (
          <video src={activeModalUrl} controls autoPlay className="w-full max-h-[75vh]" />
        ) : isDoc ? (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeModalUrl)}&embedded=true`}
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">{typeof dosyaIkonuVer === 'function' ? dosyaIkonuVer(activeModalUrl) : '📁'}</div>
            <p className="text-gray-400 mb-4">Bu dosya formatı önizlenemiyor.</p>
            <a href={activeModalUrl} download className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-xs font-bold">İndir</a>
          </div>
        )}
      </div>
    </div>
  );
}