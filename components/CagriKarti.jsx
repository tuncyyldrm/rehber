"use client";

import React, { memo, useMemo, useCallback } from "react";

const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "tiff",
  "svg",
  "avif",
  "ico",
  "heic",
]);

const getExt = (url = "") => {
  if (!url) return "";
  const path = url.split("?")[0];
  const parts = path.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const isImageFile = (url) => IMAGE_EXT.has(getExt(url));

// =================================================================
// 🚀 EVRENSEL METIN PARSER (SAAT VE TARİH ARTIK SADECE @ İLE ÇALIŞIR)
// =================================================================
const evrenselMetinParser = (text = "") => {
  if (!text) return "";

  // Regex kurallarında saat (@00:04) ve tarih (@10.06) için @ işareti zorunlu hale getirildi.
  const regex = /(\[[\s\S]*?\]\([^)]+\)|\*\*[\s\S]*?\*\*|__[\s\S]*?__|{[a-zA-Z]+}[\s\S]*?{\/[a-zA-Z]+}|@\d{2}:\d{2}(?::\d{2})?|@\d{2}\.\d{2}(?:\.\d{4})?)/g;
  
  const renkHaritasi = {
    red: "text-red-500 bg-red-950/30 px-1 rounded font-medium",
    blue: "text-blue-400 bg-blue-950/40 px-1 rounded font-medium",
    yellow: "text-yellow-500 bg-yellow-950/30 px-1 rounded font-medium",
    green: "text-emerald-400 bg-emerald-950/30 px-1 rounded font-medium"
  };

  const parts = text.split(regex);

  return parts.map((part, index) => {
    
    // 1. GÜVENLİ SAAT DAMGASI -> Sadece @00:04 veya @14:30 formatını yakalar
    if (part.startsWith('@') && part.match(/^@\d{2}:\d{2}(?::\d{2})?$/)) {
      const temizSaat = part.slice(1); // Ekranda şık dursun diye @ işaretini gizler
      return (
        <span key={index} className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-xs font-mono font-bold mx-0.5 select-all">
          ⏳ {temizSaat}
        </span>
      );
    }

    // 2. GÜVENLİ TARİH DAMGASI -> Sadece @10.06 veya @10.06.2026 formatını yakalar
    if (part.startsWith('@') && part.match(/^@\d{2}\.\d{2}(?:\.\d{4})?$/)) {
      const temizTarih = part.slice(1); // Ekranda şık dursun diye @ işaretini gizler
      return (
        <span key={index} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-xs font-mono font-bold mx-0.5 select-all">
          📅 {temizTarih}
        </span>
      );
    }

    // 3. LINK KONTROLÜ -> [Link Metni](https://...)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const textMatch = part.match(/\[([\s\S]*?)\]/);
      const urlMatch = part.match(/\(([^)]+)\)/);
      if (textMatch && urlMatch) {
        return (
          <a
            key={index}
            href={urlMatch[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-semibold underline hover:text-emerald-300 transition-colors inline-block break-all mx-0.5"
          >
            {textMatch[1]}
          </a>
        );
      }
    }

    // 4. KALIN YAZI KONTROLÜ -> **kalın yazı**
    if (part.startsWith('**') && part.endsWith('**')) {
      const temizIcerik = part.slice(2, -2);
      return (
        <strong key={index} className="text-white font-bold bg-gray-900/40 px-1 rounded">
          {temizIcerik}
        </strong>
      );
    }

    // 5. ALTI ÇİZİLİ KONTROLÜ -> __altı çizili__
    if (part.startsWith('__') && part.endsWith('__')) {
      const temizIcerik = part.slice(2, -2);
      return (
        <span key={index} className="underline decoration-emerald-500/50 decoration-2">
          {temizIcerik}
        </span>
      );
    }

    // 6. DİNAMİK RENK KONTROLÜ -> {red}metin{/red}
    if (part.startsWith('{') && part.endsWith('}')) {
      const renkMatch = part.match(/^{([a-zA-Z]+)}/);
      if (renkMatch) {
        const renkAdi = renkMatch[1];
        const stil = renkHaritasi[renkAdi];
        
        if (stil) {
          const temizIcerik = part.replace(`{${renkAdi}}`, '').slice(0, -`{/${renkAdi}}`.length);
          return (
            <span key={index} className={stil}>
              {temizIcerik}
            </span>
          );
        }
      }
    }

    // Hiçbir kurala uymayan düz metinler
    return part;
  });
};

const CagriKarti = ({
  item,
  genisletilmisId,
  setGenisletilmisId,
  duzenleModunuAc,
  kayıtSil,
  setActiveModalUrl,
  dosyaAdiniAyıkla,
  dosyaIkonuVer,
}) => {
  const isGenisletilmis = genisletilmisId === item.id;

  // =========================
  // DATE CACHE (GÜVENLİ VE HIZLI)
  // =========================
  const formattedDate = useMemo(() => {
    if (!item.created_at) return "-";
    try {
      return new Date(item.created_at).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  }, [item.created_at]);

  // =========================
  // HANDLERS (STABLE)
  // =========================
  const toggleExpand = useCallback(() => {
    setGenisletilmisId(isGenisletilmis ? null : item.id);
  }, [isGenisletilmis, item.id, setGenisletilmisId]);

  const handleEdit = useCallback(() => {
    if (typeof duzenleModunuAc === "function") duzenleModunuAc(item);
  }, [duzenleModunuAc, item]);

  const handleDelete = useCallback(() => {
    if (typeof kayıtSil === "function") kayıtSil(item.id);
  }, [kayıtSil, item.id]);

  const openFile = useCallback((url) => {
    if (typeof setActiveModalUrl === "function") setActiveModalUrl(url);
  }, [setActiveModalUrl]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-emerald-500 shadow w-full overflow-hidden transition-all duration-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3 w-full min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 font-mono mb-1">
            {formattedDate}
          </div>

          <h4
            onClick={toggleExpand}
            className={`font-bold text-white uppercase cursor-pointer hover:text-emerald-400 transition-colors ${
              isGenisletilmis
                ? "whitespace-normal text-base"
                : "truncate text-lg"
            }`}
          >
            🏢 {item.firma || "Bilinmeyen Firma"}
          </h4>

          <div className="flex flex-col gap-1 mt-2">
            <p className="text-sm text-gray-300 truncate">
              👤 <span className="font-semibold">{item.kisi || "Belirtilmemiş"}</span>
            </p>

            {item.tel && (
              <a
                href={`tel:${item.tel.replace(/\s+/g, "")}`}
                className="inline-block text-emerald-400 font-mono text-sm hover:underline"
              >
                📞 {item.tel}
              </a>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start border-t border-gray-800 sm:border-0 pt-3 sm:pt-0">
          <span
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              item.uygulama?.toLowerCase().includes("gastro")
                ? "bg-red-900/40 text-red-300 border-red-700"
                : "bg-blue-900/40 text-blue-300 border-blue-700"
            }`}
          >
            {item.uygulama || "Diğer"}
          </span>

          <div className="flex gap-1.5">
            <button
              onClick={handleEdit}
              className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded hover:bg-blue-800 transition"
            >
              Düzenle
            </button>

            <button
              onClick={handleDelete}
              className="text-[10px] bg-red-900/50 text-red-300 px-2 py-1 rounded hover:bg-red-800 transition"
            >
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {item.aciklama?.trim() && (
        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
          {evrenselMetinParser(item.aciklama)}
        </p>
      )}

      {/* FILES */}
      {Array.isArray(item.dosyalar) && item.dosyalar.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <span className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">
            Ekteki Dosyalar ({item.dosyalar.length})
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {item.dosyalar.map((url, i) => {
              const uniqueKey = `${url}-${i}`;
              return (
                <div
                  key={uniqueKey}
                  className="bg-gray-950 p-1.5 rounded-lg border border-gray-800 hover:border-emerald-700 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => openFile(url)}
                    className="w-full h-[40px] flex items-center justify-center text-xl overflow-hidden rounded bg-gray-900"
                  >
                    {isImageFile(url) ? (
                      <img
                        src={url}
                        alt="Ek"
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      <span className="opacity-80 pointer-events-none">
                        {typeof dosyaIkonuVer === "function" ? dosyaIkonuVer(url) : "📁"}
                      </span>
                    )}
                  </button>

                  <p className="mt-1.5 text-[9px] text-gray-400 truncate text-center px-1 font-mono">
                    {typeof dosyaAdiniAyıkla === "function" ? dosyaAdiniAyıkla(url) : "dosya"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================
// MEMO OPTIMIZATION
// =========================
export default memo(CagriKarti, (prev, next) => {
  return (
    prev.genisletilmisId === next.genisletilmisId &&
    prev.item.id === next.item.id &&
    prev.item.firma === next.item.firma &&
    prev.item.kisi === next.item.kisi &&
    prev.item.tel === next.item.tel &&
    prev.item.uygulama === next.item.uygulama &&
    prev.item.aciklama === next.item.aciklama &&
    prev.item.created_at === next.item.created_at &&
    JSON.stringify(prev.item.dosyalar) === JSON.stringify(next.item.dosyalar)
  );
});