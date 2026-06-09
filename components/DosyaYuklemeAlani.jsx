"use client";

import React from 'react';

export default function DosyaYuklemeAlani({
    handleCokluDosyaYukle,
    uploading,
    formData,
    dosyaIkonuVer,
    dosyaAdiniAyıkla,
    yuklenenDosyayiKaldir,
    setActiveModalUrl
}) {
    
// =========================
// SMART FILE TYPE & ICON HELPER (Shorts ve Parametre Destekli)
// =========================
const getLinkTipi = (url) => {
    if (!url) return { icon: '🔗', label: 'Link' };
    
    // 1. YouTube ve YouTube Shorts Kontrolü
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        return { icon: '🎬', label: 'YouTube' };
    }
    
    // 2. Dışarıdan gelen custom ikon fonksiyonu varsa çalıştır
    if (typeof dosyaIkonuVer === 'function') {
        const customIcon = dosyaIkonuVer(url);
        if (customIcon && customIcon !== '📁') {
            return { icon: customIcon, label: 'Dosya' };
        }
    }

    // 3. URL Parametrelerini (?token=...) temizleyip uzantıyı güvenli yakalama
    const temizUrl = url.split('?')[0].toLowerCase();
    
    if (temizUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg|avif|ico|heic)$/i)) return { icon: '🖼️', label: 'Görsel' };
    if (temizUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i)) return { icon: '🎥', label: 'Video' };
    if (temizUrl.endsWith('.pdf')) return { icon: '📄', label: 'PDF' };
    if (temizUrl.match(/\.(docx|doc|xlsx|xls|pptx|ppt|csv)$/i)) return { icon: '📊', label: 'Döküman' };
    if (temizUrl.match(/\.(txt|log)$/i)) return { icon: '📝', label: 'Metin' };
    
    return { icon: '🌐', label: 'Link' };
};

// =========================
// FILE NAME RENDERER (Shorts Destekli)
// =========================
const renderFileName = (url) => {
    if (!url) return "Dosya";
    
    // YouTube Shorts link başlığını da yakala
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        return url.includes('/shorts/') ? "YouTube Shorts Videosu" : "YouTube Videosu";
    }

    try {
        return typeof dosyaAdiniAyıkla === 'function' ? dosyaAdiniAyıkla(url) : "Dosya";
    } catch (err) {
        return "Dosya";
    }
};

    return (
        <div className="space-y-3">
            {/* SÜRÜKLE BIRAK & LINK ALANI */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-4 transition-all focus-within:border-emerald-500 ${
                    uploading 
                        ? 'border-amber-500 bg-amber-500/5 cursor-not-allowed' 
                        : 'border-gray-700 hover:border-emerald-500 bg-gray-950/50'
                }`}
                onDragOver={(e) => {
                    if (uploading) return;
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    if (uploading) return;
                    if (typeof handleCokluDosyaYukle === 'function') {
                        handleCokluDosyaYukle(e);
                    }
                }}
            >
                <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    id="fileInput" 
                    onChange={handleCokluDosyaYukle} 
                    disabled={uploading} 
                />
                
                <label 
                    htmlFor="fileInput" 
                    className={`flex flex-col items-center gap-1 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span className={`text-2xl ${uploading ? 'animate-bounce text-amber-500' : 'text-gray-400'}`}>
                        {uploading ? '⏳' : '📁'}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {uploading ? 'Dosyalar İşleniyor...' : 'Dosya Sürükleyin veya Seçin'}
                    </span>
                </label>

                <input
                    type="text"
                    placeholder="Veya buraya link yapıştırın..."
                    disabled={uploading}
                    className="w-full mt-3 bg-black/40 border border-gray-700 rounded-lg p-2 text-center text-xs text-emerald-400 placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    onPaste={(e) => {
                        if (uploading) return;
                        if (typeof handleCokluDosyaYukle === 'function') {
                            handleCokluDosyaYukle(e);
                            // Yapıştırma işleminden hemen sonra input içeriğini temiz tutmak için:
                            setTimeout(() => { e.target.value = ''; }, 50);
                        }
                    }}
                />
            </div>

            {/* YÜKLENEN DOSYALAR LİSTESİ */}
            {Array.isArray(formData?.dosyalar) && formData.dosyalar.length > 0 && (
                <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {formData.dosyalar.map((url, index) => {
                        const { icon } = getLinkTipi(url);
                        // Güvenli ve benzersiz key kuralı
                        const uniqueKey = `${url}-${index}`;

                        return (
                            <div 
                                key={uniqueKey} 
                                className="flex items-center justify-between gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800 group hover:border-gray-700 transition-all animate-fadeIn overflow-hidden"
                            >
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (typeof setActiveModalUrl === 'function') {
                                            setActiveModalUrl(url);
                                        }
                                    }}
                                    className="flex-1 flex items-center gap-2 min-w-0 text-left disabled:cursor-not-allowed focus:outline-none"
                                >
                                    <span className="text-sm shrink-0 select-none">{icon}</span>
                                    <span className="block truncate text-[11px] font-mono text-gray-300 group-hover:text-emerald-400 transition-colors">
                                        {renderFileName(url)}
                                    </span>
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (typeof yuklenenDosyayiKaldir === 'function') {
                                            yuklenenDosyayiKaldir(index);
                                        }
                                    }}
                                    className="text-gray-500 hover:text-red-400 focus:text-red-400 px-2 text-[10px] font-bold uppercase shrink-0 transition-colors focus:outline-none"
                                >
                                    Sil
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}