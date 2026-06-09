"use client";

import React, { useState, useRef } from 'react';

export default function DosyaYuklemeAlani({
    handleCokluDosyaYukle,
    uploading,
    formData,
    dosyaIkonuVer,
    dosyaAdiniAyıkla,
    yuklenenDosyayiKaldir,
    setActiveModalUrl
}) {
    const [isDragActive, setIsDragActive] = useState(false);
    
    // 🎯 Dinamik accept yönetimi için state (Varsayılan olarak her şeyi kabul eder)
    const [acceptType, setAcceptType] = useState("audio/*,video/*,image/*,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/log,text/csv");
    const [captureType, setCaptureType] = useState(undefined);
    
    const fileInputRef = useRef(null);

// =================================================================
// SMART FILE TYPE & ICON HELPER
// =================================================================
const getLinkTipi = (url) => {
    if (!url) return { icon: '🔗', label: 'Link' };
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        return { icon: '🎬', label: 'YouTube' };
    }
    if (typeof dosyaIkonuVer === 'function') {
        const customIcon = dosyaIkonuVer(url);
        if (customIcon && customIcon !== '📁') return { icon: customIcon, label: 'Dosya' };
    }
    const temizUrl = url.split('?')[0].toLowerCase();
    if (temizUrl.match(/\.(mp3|wav|m4a|aac|ogg|wma|flac|m4b|opus)$/i)) return { icon: '🎵', label: 'Ses' };
    if (temizUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg|avif|ico|heic)$/i)) return { icon: '🖼️', label: 'Görsel' };
    if (temizUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i)) return { icon: '🎥', label: 'Video' };
    if (temizUrl.endsWith('.pdf')) return { icon: '📄', label: 'PDF' };
    if (temizUrl.match(/\.(docx|doc|xlsx|xls|pptx|ppt|csv|odt|ods)$/i)) return { icon: '📊', label: 'Döküman' };
    if (temizUrl.match(/\.(txt|log)$/i)) return { icon: '📝', label: 'Metin' };
    return { icon: '🌐', label: 'Link' };
};

const renderFileName = (url) => {
    if (!url) return "Dosya";
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/shorts/')) {
        return url.includes('/shorts/') ? "YouTube Shorts Videosu" : "YouTube Videosu";
    }
    const temizUrl = url.split('?')[0].toLowerCase();
    if (temizUrl.match(/\.(mp3|wav|m4a|aac|ogg|wma|flac|m4b|opus)$/i)) {
        return typeof dosyaAdiniAyıkla === 'function' ? dosyaAdiniAyıkla(url) : "Ses Kaydı";
    }
    try { return typeof dosyaAdiniAyıkla === 'function' ? dosyaAdiniAyıkla(url) : "Dosya"; } catch { return "Dosya"; }
};

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (uploading) return;
        if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
        else if (e.type === "dragleave") setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
        if (uploading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && typeof handleCokluDosyaYukle === 'function') {
            handleCokluDosyaYukle(e);
        }
    };

    // 🚀 ALAN TIKLANDIĞINDA MOBİL İÇİN SEÇİM YAPTIRAN AKILLI TETİKLEYİCİ
    const handleAreaClick = (e) => {
        if (uploading) return;
        e.preventDefault();

        // Masaüstünde doğrudan input'u tetikle (Seçim penceresine gerek yok)
        if (!navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
            fileInputRef.current?.click();
            return;
        }

        // Mobilde kullanıcıya ne yapmak istediğini temiz bir prompt ile soruyoruz
        const secim = window.confirm("Ses kaydı yapmak için 'Tamam' (OK) butonuna basın.\n\nFotoğraf, Video veya Döküman seçmek için 'İptal' (Cancel) butonuna basın.");

        if (secim) {
            // 🎤 Kullanıcı SES seçti: Input'u sadece ses kaydediciyi zorlayacak hale getiriyoruz
            setAcceptType("audio/*");
            setCaptureType("microphone");
        } else {
            // 📁 Kullanıcı DOSYA seçti: Standart haline geri döndürüyoruz
            setAcceptType("audio/*,video/*,image/*,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain");
            setCaptureType(undefined);
        }

        // State'in güncellenmesi için mikro saniyelik bir gecikmeyle input'u açıyoruz
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    };

    return (
        <div className="space-y-3">
            {/* SÜRÜKLE BIRAK & LINK ALANI */}
            <div
                onClick={handleAreaClick} // 🎯 Tıklama olayını artık etiket değil, div yönetiyor
                className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer ${
                    uploading 
                        ? 'border-amber-500 bg-amber-500/5 cursor-not-allowed' 
                        : isDragActive
                            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                            : 'border-gray-700 hover:border-emerald-500 bg-gray-950/50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
            >
                <input 
                    type="file" 
                    multiple={captureType !== "microphone"} // Ses kaydederken çoklu seçim kapatılır (Stabilite için)
                    accept={acceptType}
                    capture={captureType} // 🎯 Mobilde direkt mikrofona zorlayan dinamik komut
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={(e) => {
                        if (uploading) return;
                        if (e.target.files && e.target.files.length > 0) {
                            handleCokluDosyaYukle(e);
                        }
                    }} 
                    disabled={uploading} 
                />
                
                <div className="flex flex-col items-center gap-1">
                    <span className={`text-2xl ${uploading ? 'animate-bounce text-amber-500' : isDragActive ? 'animate-pulse text-emerald-400' : 'text-gray-400'}`}>
                        {uploading ? '⏳' : isDragActive ? '📥' : '📁'}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center select-none">
                        {uploading ? 'Dosyalar İşleniyor...' : 'Seçmek veya Ses Kaydetmek İçin Dokunun'}
                    </span>
                </div>

                {/* Link alanı içindeki tıklamanın üst div'i tetikleyip menü açmasını engelliyoruz */}
                <input
                    type="text"
                    placeholder="Veya buraya link yapıştırın..."
                    disabled={uploading}
                    onClick={(e) => e.stopPropagation()} 
                    className="w-full mt-3 bg-black/40 border border-gray-700 rounded-lg p-2 text-center text-xs text-emerald-400 placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    onPaste={(e) => {
                        if (uploading) return;
                        if (typeof handleCokluDosyaYukle === 'function') {
                            handleCokluDosyaYukle(e);
                            setTimeout(() => { e.target.value = ''; }, 50);
                        }
                    }}
                />
            </div>

            {/* YÜKLENEN DOSYALAR LİSTESİ */}
            {Array.isArray(formData?.dosyalar) && formData.dosyalar.length > 0 && (
                <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {formData.dosyalar.map((url, index) => {
                        if (!url) return null;
                        const { icon } = getLinkTipi(url);
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
                                        e.preventDefault(); e.stopPropagation();
                                        if (typeof setActiveModalUrl === 'function') setActiveModalUrl(url);
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
                                        e.preventDefault(); e.stopPropagation();
                                        if (typeof yuklenenDosyayiKaldir === 'function') yuklenenDosyayiKaldir(index);
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