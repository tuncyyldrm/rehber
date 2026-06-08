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
    // İkon belirleme mantığı
    const getLinkTipi = (url) => {
        if (!url) return { icon: '🔗', label: 'Link' };
        if (url.includes('youtube.com') || url.includes('youtu.be')) return { icon: '🎬', label: 'YouTube' };
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return { icon: '🖼️', label: 'Görsel' };
        if (url.match(/\.(mp4|webm|mov)$/i)) return { icon: '🎥', label: 'Video' };
        if (url.endsWith('.pdf')) return { icon: '📄', label: 'PDF' };
        return { icon: '🌐', label: 'Link' };
    };

    // İsim gösterme mantığı
    const renderFileName = (url) => {
        if (!url) return "Dosya";
        if (url.includes('youtube.com') || url.includes('youtu.be')) return "YouTube Videosu";

        // Hata almayı önlemek için basit bir kontrol
        try {
            return dosyaAdiniAyıkla ? dosyaAdiniAyıkla(url) : "Dosya";
        } catch (err) {
            return "Dosya";
        }
    };

    return (
        <div className="space-y-3">
            <div
                className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${uploading ? 'border-amber-500 bg-amber-500/5' : 'border-gray-800 hover:border-emerald-500 bg-gray-950/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleCokluDosyaYukle(e); }}
            >
                <input type="file" multiple className="hidden" id="fileInput" onChange={handleCokluDosyaYukle} disabled={uploading} />
                <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-1">
                    <span className="text-2xl">{uploading ? '⏳' : '📁'}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {uploading ? 'İşleniyor...' : 'Dosya Ekle'}
                    </span>
                </label>

                <input
                    type="text"
                    placeholder="Link yapıştır..."
                    className="w-full mt-3 bg-black/40 border border-gray-700 rounded-lg p-2 text-center text-xs text-emerald-400 placeholder-gray-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                    onPaste={handleCokluDosyaYukle}
                />
            </div>

            {formData.dosyalar?.length > 0 && (
                <div className="grid gap-2">
                    {formData.dosyalar.map((url, index) => {
                        const { icon } = getLinkTipi(url);
                        return (
                            <div key={index} className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800 group animate-fadeIn overflow-hidden">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setActiveModalUrl(url);
                                    }}
                                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                                >
                                    <span className="text-sm shrink-0">{icon}</span>
                                    <span className="block truncate text-[11px] font-mono text-gray-300 group-hover:text-emerald-400 transition">
                                        {renderFileName(url)}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        yuklenenDosyayiKaldir(index);
                                    }}
                                    className="text-gray-600 hover:text-red-500 px-2 text-[10px] font-bold uppercase shrink-0"
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