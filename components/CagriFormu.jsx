"use client";

import React, { useRef, useLayoutEffect, useMemo } from "react";
import DosyaYuklemeAlani from "./DosyaYuklemeAlani";

export default function CagriFormu({
  formData,
  setFormData,
  handleKayıtSubmit,
  editingId,
  setEditingId,
  uploading,
  handleCokluDosyaYukle,
  dosyaIkonuVer,
  dosyaAdiniAyıkla,
  yuklenenDosyayiKaldir,
  setActiveModalUrl,
  sablonEkle,
  results = [],
}) {
  const textareaRef = useRef(null);

  // =========================
  // HELPERS
  // =========================
  const normalize = (v = "") => String(v).replace(/\D/g, "");

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 🚀 MİKRO BUTONLAR İÇİN STİL EKLEME FONKSİYONU
  const stiliEkle = (stilBaslangic, stilBitis) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value || "";

    // Seçilen kelimeyi veya boş alanı etiketlerin arasına al
    const secilenMetin = text.substring(start, end);
    const yeniMetin =
      text.substring(0, start) +
      `${stilBaslangic}${secilenMetin}${stilBitis}` +
      text.substring(end);

    updateField("aciklama", yeniMetin);

    // Kullanıcın odağını kaybetmemesi için imleci (cursor) otomatik olarak yeni kelimenin içine ayarla
    setTimeout(() => {
      textarea.focus();
      if (start === end) {
        // Eğer hiçbir şey seçilmemişse imleci etiketlerin tam ortasına koy (Yazmaya hazır olsun)
        textarea.setSelectionRange(start + stilBaslangic.length, start + stilBaslangic.length);
      } else {
        // Seçilen metin varsa, yeni eklenen etiketleri kapsayacak şekilde seçili bırak
        textarea.setSelectionRange(start, start + stilBaslangic.length + secilenMetin.length + stilBitis.length);
      }
    }, 50);
  };

  // =========================
  // INDEX (OPTIMIZED LOOKUP)
  // =========================
  const indexedResults = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(results)) return map;

    for (const item of results) {
      if (item?.tel && !map.has(item.tel)) {
        map.set(item.tel, item);
      }
    }

    return map;
  }, [results]);

  // =========================
  // SMART SUGGESTIONS
  // =========================
  const gosterilecekOneriler = useMemo(() => {
    if (!formData.tel || formData.tel.length <= 2) return [];

    const aranan = normalize(formData.tel);
    const filtrelenmis = [];

    for (const [tel, item] of indexedResults) {
      if (normalize(tel).includes(aranan)) {
        filtrelenmis.push(item);

        if (filtrelenmis.length >= 5) break;
      }
    }

    return filtrelenmis;
  }, [formData.tel, indexedResults]);

  // =========================
  // AUTO TEXTAREA HEIGHT
  // =========================
  useLayoutEffect(() => {
    if (!textareaRef.current) return;

    const adjustHeight = () => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    };

    adjustHeight();
    const timer = setTimeout(adjustHeight, 0);
    return () => clearTimeout(timer);
  }, [formData.aciklama]);

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      tel: "",
      firma: "",
      kisi: "",
      uygulama: "Diğer",
      aciklama: "",
      dosyalar: [],
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit text-gray-200">
      {/* HEADER */}
      <h2 className="text-md font-semibold mb-4 text-gray-200 flex justify-between items-center">
        <span>{editingId ? "📝 Kaydı Düzenle" : "📞 Yeni Çağrı / Talep"}</span>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            İptal Et
          </button>
        )}
      </h2>

      <form onSubmit={handleKayıtSubmit} className="space-y-4">
        {/* TELEFON */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Telefon *</label>
          <input
            type="text"
            required
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            value={formData.tel}
            onChange={(e) => updateField("tel", e.target.value)}
          />
        </div>

        {/* SUGGESTIONS */}
        {!editingId && gosterilecekOneriler.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs space-y-1">
            {gosterilecekOneriler.map((oneri, idx) => {
              const isSelected = formData.tel === oneri.tel;

              return (
                <button
                  key={idx}
                  type="button"
                  aria-label="Telefon önerisi seç"
                  className={`w-full p-2 rounded text-left flex justify-between border transition-colors ${
                    isSelected
                      ? "bg-emerald-900/60 border-emerald-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      tel: oneri.tel || "",
                      firma: oneri.firma || "",
                      kisi: oneri.kisi || "",
                    }))
                  }
                >
                  <div className="truncate">
                    <div className="font-semibold text-gray-200 truncate">
                      {oneri.firma || "İsimsiz Firma"}
                    </div>
                    <div
                      className={`font-mono mt-0.5 ${
                        isSelected ? "text-emerald-200" : "text-emerald-400"
                      }`}
                    >
                      {oneri.tel}
                      {oneri.kisi && (
                        <span className="text-gray-400 font-sans"> / {oneri.kisi}</span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] bg-emerald-500 px-1.5 py-0.5 rounded text-white self-center shrink-0">
                      Seçili
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* FİRMA / KİŞİ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Firma *</label>
            <input
              type="text"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              value={formData.firma}
              onChange={(e) => updateField("firma", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Kişi *</label>
            <input
              type="text"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              value={formData.kisi}
              onChange={(e) => updateField("kisi", e.target.value)}
            />
          </div>
        </div>

        {/* UYGULAMA */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Uygulama / Cihaz</label>
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            value={formData.uygulama}
            onChange={(e) => updateField("uygulama", e.target.value)}
          >
            <option value="Gastropos">Gastropos</option>
            <option value="M320 Medusa">M320 Medusa</option>
            <option value="M320">M320</option>
            <option value="Zen2o">Zen2o</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>

        {/* DOSYALAR */}
        <DosyaYuklemeAlani
          handleCokluDosyaYukle={handleCokluDosyaYukle}
          uploading={uploading}
          formData={formData}
          dosyaIkonuVer={dosyaIkonuVer}
          dosyaAdiniAyıkla={dosyaAdiniAyıkla}
          yuklenenDosyayiKaldir={yuklenenDosyayiKaldir}
          setActiveModalUrl={setActiveModalUrl}
        />

        {/* AÇIKLAMA */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama</label>
          
          {/* 🚀 HAZIRLADIĞIN MİKRO BUTON ŞERİDİ (stiliEkle ARTIK BAĞLI) */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-900/60 border-t border-x border-gray-800 rounded-t-lg -mb-3 relative z-10 w-fit ml-auto mr-2">
            <button
              type="button"
              onClick={() => stiliEkle("{red}", "{/red}")}
              className="text-red-400 hover:bg-red-950/50 p-1 rounded text-xs font-bold"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => stiliEkle("{green}", "{/green}")}
              className="text-emerald-400 hover:bg-emerald-950/50 p-1 rounded text-xs font-bold"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => stiliEkle("{yellow}", "{/yellow}")}
              className="text-yellow-400 hover:bg-yellow-950/50 p-1 rounded text-xs font-bold"
            >
              A
            </button>
            <div className="w-[1px] h-3 bg-gray-800 mx-0.5" />
            <button
              type="button"
              onClick={() => stiliEkle("**", "**")}
              className="text-gray-300 hover:bg-gray-800 p-1 rounded text-xs font-bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => stiliEkle("[", "](https://)")}
              className="text-gray-300 hover:bg-gray-800 p-1 rounded text-xs"
            >
              🔗
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm resize-none overflow-hidden focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            value={formData.aciklama || ""}
            onChange={(e) => updateField("aciklama", e.target.value)}
            placeholder="Detay yaz..."
          />

          {/* ŞABLONLAR */}
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (typeof sablonEkle === "function") sablonEkle("{green}Sorun çözüldü.{/green}");
              }}
              className="text-xs bg-green-800/50 border border-green-600 text-amber-300 hover:bg-green-600/50 px-2 py-1 rounded transition"
            >
              ⚙️ Çözüldü
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof sablonEkle === "function") sablonEkle("{red}Dönüş yapılacak, bekleniyor.{/red}");
              }}
              className="text-xs bg-amber-950/40 border border-amber-800 text-amber-300 hover:bg-amber-800/40 px-2 py-1 rounded transition"
            >
              ⏳ Beklemede
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof sablonEkle === "function") sablonEkle("{yellow}Lisans işlemleri.{/yellow}");
              }}
              className="text-xs bg-yellow-800/50 border border-yellow-600 text-amber-300 hover:bg-yellow-600/50 px-2 py-1 rounded transition"
            >
              🔑 Lisans
            </button>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={uploading}
          className={`w-full p-3 rounded-lg font-semibold transition-all ${
            uploading
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.99]"
          }`}
        >
          {uploading ? "İşleniyor..." : editingId ? "Güncelle" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}