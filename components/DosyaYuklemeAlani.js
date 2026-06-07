"use client";

import React, { useRef } from 'react';

export default function DosyaYuklemeAlani({
    handleCokluDosyaYukle,
    uploading,
    formData,
    dosyaIkonuVer,
    dosyaAdiniAyıkla,
    yuklenenDosyayiKaldir,
    setActiveModalUrl
}) {
    const kutuRef = useRef(null);

    // Fare kutunun üzerine geldiğinde odağı buraya zorla çekiyoruz
    const handleMouseEnter = () => {
        if (kutuRef.current) {
            kutuRef.current.focus();
        }
    };

    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-emerald-500'); // Stili temizle
                handleCokluDosyaYukle(e);
            }}
            onDragEnter={(e) => e.currentTarget.classList.add('border-emerald-500')}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-emerald-500')}
            ref={kutuRef}
            tabIndex={0} // Elementin odaklanabilir (focusable) olmasını sağlar
            onMouseEnter={handleMouseEnter} // Fare üzerine geldiği an odağı alır
            onPaste={handleCokluDosyaYukle}
            // Odaklanıldığında şık bir halka çıksın diye focus:ring ekledik (isteğe bağlı)
            className="group relative border-2 border-dashed border-gray-800 hover:border-emerald-600/50 bg-gray-950/40 rounded-xl p-4 transition-all duration-200 cursor-pointer text-center outline-none focus:ring-1 focus:ring-emerald-500/30"
        >
            <label className="cursor-pointer block space-y-1">
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200">📁</div>
                <div className="text-xs font-semibold text-gray-300">
                    Dosya seçmek için <span className="text-emerald-400 underline decoration-wavy">tıklayın</span>
                </div>
                <div className="text-[10px] text-gray-500">
                    veya buraya <span className="text-red-400 font-medium">YouTube Linki</span> / <span className="text-sky-400 font-medium">Ekran Görüntüsü</span> yapıştırın
                </div>
                <input
                    type="file"
                    multiple
                    onChange={handleCokluDosyaYukle}
                    className="hidden"
                    disabled={uploading}
                />
            </label>

            {uploading && (
                <div className="absolute inset-0 bg-gray-950/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <p className="text-xs text-amber-400 font-medium animate-pulse flex items-center gap-2">
                        ⏳ Ögeler işleniyor ve yükleniyor...
                    </p>
                </div>
            )}

            {formData.dosyalar?.length > 0 && (
                <div
                    className="mt-3 p-2 bg-gray-900/90 rounded-lg border border-gray-800 space-y-1.5 max-h-[160px] overflow-y-auto text-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    {formData.dosyalar.map((url, index) => {
                        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
                        return (
                            <div key={index} className="flex justify-between items-center bg-gray-950 p-2 rounded-md border border-gray-800/60 text-xs hover:border-gray-700 transition">
                                <div
                                    className="flex items-center gap-2 min-w-0 flex-1 mr-2 cursor-pointer group/item"
                                    onClick={() => setActiveModalUrl(url)}
                                >
                                    <span className="text-sm shrink-0">
                                        {isYoutube ? '🎬' : dosyaIkonuVer(url)}
                                    </span>
                                    <span className="truncate text-gray-300 font-mono text-[11px] group-hover/item:text-emerald-400 transition" title={url}>
                                        {isYoutube
                                            ? `🎬 YouTube: ${url.includes('v=') ? url.split('v=')[1].substring(0, 10) : url.split('/').pop().substring(0, 10)}...`
                                            : dosyaAdiniAyıkla(url)
                                        }
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => yuklenenDosyayiKaldir(index)}
                                    className="text-gray-500 hover:text-red-400 text-[10px] font-bold shrink-0 transition"
                                >
                                    ✕ Kaldır
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}