"use client";

import React, { useRef, useLayoutEffect, useMemo } from 'react';
import DosyaYuklemeAlani from './DosyaYuklemeAlani';

export default function CagriFormu({
    formData, setFormData, handleKayıtSubmit, editingId, setEditingId,
    uploading, handleCokluDosyaYukle, dosyaIkonuVer, dosyaAdiniAyıkla,
    yuklenenDosyayiKaldir, setActiveModalUrl, sablonEkle, results = []
}) {
    const textareaRef = useRef(null);

    // Mükerrer kayıtları engelleyen ve benzersiz veri setleri sunan akıllı filtre (useMemo ile optimize edildi)
    const gosterilecekOneriler = useMemo(() => {
        if (!formData.tel || formData.tel.length <= 2) return [];

        const aranan = formData.tel.trim();
        const gorulenNumaralar = new Set();
        const filtrelenmiş = [];

        for (const item of results) {
            if (item.tel && item.tel.includes(aranan)) {
                // Eğer bu numara listede halihazırda işlenmediyse ekle
                if (!gorulenNumaralar.has(item.tel)) {
                    gorulenNumaralar.add(item.tel);
                    filtrelenmiş.push(item);
                }
                // Maksimum 5 benzersiz öneri gösterildikten sonra döngüyü kır
                if (filtrelenmiş.length >= 5) break;
            }
        }
        return filtrelenmiş;
    }, [formData.tel, results]);

    // Textarea yüksekliğini içeriğe göre dinamik ayarlar
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [formData.aciklama]);

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
            <h2 className="text-md font-semibold mb-4 text-gray-200 flex justify-between items-center">
                <span>{editingId ? "📝 Kaydı Düzenle" : "📞 Yeni Çağrı / Talep Logla"}</span>
                {editingId && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: [] });
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline transition"
                    >
                        İptal Et
                    </button>
                )}
            </h2>

            <form onSubmit={handleKayıtSubmit} className="space-y-4">
                {/* Telefon Girişi */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Telefon *</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        value={formData.tel}
                        onChange={(e) => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                    />
                </div>

                {/* ÖNERİ MOTORU PANELI (Sadeleştirilmiş ve Tam Responsive) */}
                {!editingId && gosterilecekOneriler.length > 0 && (
                    <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs space-y-1">
                        <div className="grid grid-cols-1 gap-1">
                            {gosterilecekOneriler.map((oneri, idx) => {
                                const isSelected = formData.tel === oneri.tel;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`w-full p-2 rounded text-left flex items-center justify-between border ${isSelected ? "bg-emerald-900 border-emerald-500" : "bg-gray-800 border-gray-700 hover:border-gray-500"
                                            }`}
                                        onClick={() => setFormData(prev => ({ ...prev, tel: oneri.tel, firma: oneri.firma, kisi: oneri.kisi }))}
                                    >
                                        <div className="truncate">
                                            <div className="font-semibold text-gray-200 truncate">{oneri.firma || "İsimsiz"}</div>
                                            <div className={`font-mono ${isSelected ? "text-emerald-100" : "text-emerald-500"}`}>
                                                {oneri.tel} {oneri.kisi && <span className="text-gray-400">/ {oneri.kisi}</span>}
                                            </div>
                                        </div>
                                        {isSelected && <span className="text-[10px] bg-emerald-500 px-1.5 py-0.5 rounded text-white">Seçili</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Firma ve Kişi Alanları */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Firma *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            value={formData.firma}
                            onChange={(e) => setFormData(prev => ({ ...prev, firma: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kişi *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            value={formData.kisi}
                            onChange={(e) => setFormData(prev => ({ ...prev, kisi: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Uygulama / Cihaz Seçimi */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Kullandığı Uygulama / Cihaz</label>
                    <select
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        value={formData.uygulama}
                        onChange={(e) => setFormData(prev => ({ ...prev, uygulama: e.target.value }))}
                    >
                        <option value="Gastropos">Gastropos</option>
                        <option value="M320 Medusa">M320 Medusa</option>
                        <option value="M320">M320</option>
                        <option value="Zen2o">Zen2o</option>
                        <option value="Diğer">Diğer</option>
                    </select>
                </div>

                {/* Alt Modül: Dosya Yükleme Alanı */}
                <DosyaYuklemeAlani
                    handleCokluDosyaYukle={handleCokluDosyaYukle}
                    uploading={uploading}
                    formData={formData}
                    dosyaIkonuVer={dosyaIkonuVer}
                    dosyaAdiniAyıkla={dosyaAdiniAyıkla}
                    yuklenenDosyayiKaldir={yuklenenDosyayiKaldir}
                    setActiveModalUrl={setActiveModalUrl}
                />

                {/* Açıklama ve Metin Şablonları */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Talep Detayı</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        <button type="button" onClick={() => sablonEkle("Uzak bağlantı ile sorun çözüldü.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition">⚙️ Çözüldü</button>
                        <button type="button" onClick={() => sablonEkle("Lisans güncellemesi yapıldı.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition">🔑 Lisans</button>
                        <button type="button" onClick={() => sablonEkle("Dönüş yapılacak, bekleniyor.")} className="text-[11px] bg-amber-950/40 border border-amber-800 text-amber-300 px-2 py-1 rounded transition">⏳ Beklemede</button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        rows="4"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none overflow-hidden"
                        value={formData.aciklama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                        placeholder="Müşteri talebini veya yapılan işlemi buraya detaylandırın..."
                    />
                </div>

                {/* Aksiyon Butonu */}
                <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full p-3 rounded-lg font-semibold transition ${uploading ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}
                >
                    {uploading ? "Dosyalar İşleniyor..." : (editingId ? "Değişiklikleri Kaydet" : "Çağrıyı Sisteme Kaydet")}
                </button>
            </form>
        </div>
    );
}