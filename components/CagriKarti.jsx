import React, { memo } from 'react';

const CagriKarti = ({ 
  item, 
  genisletilmisId, 
  setGenisletilmisId, 
  duzenleModunuAc, 
  kayıtSil, 
  setActiveModalUrl,
  dosyaAdiniAyıkla,
  dosyaIkonuVer 
}) => {
  // Sadece bu kart genişletilmiş mi?
  const isGenisletilmis = genisletilmisId === item.id;

  // Tarih formatlama işlemini her render'da değil, sadece tarih değişirse yap
  const formattedDate = React.useMemo(() => 
    new Date(item.created_at).toLocaleString('tr-TR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    }), [item.created_at]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-emerald-500 shadow w-full overflow-hidden transition-all duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3 w-full min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 font-mono mb-1">{formattedDate}</div>
          <h4
            onClick={() => setGenisletilmisId(isGenisletilmis ? null : item.id)}
            className={`font-bold text-white uppercase cursor-pointer hover:text-emerald-400 transition-colors ${isGenisletilmis ? "text-base whitespace-normal" : "truncate text-lg"}`}
          >
            🏢 {item.firma || "Bilinmeyen Firma"}
          </h4>
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-sm text-gray-300 truncate">👤 <span className="font-semibold">{item.kisi || "Belirtilmemiş"}</span></p>
            <a href={`tel:${item.tel}`} className="inline-block text-emerald-400 font-mono text-sm hover:underline">📞 {item.tel}</a>
          </div>
        </div>

        <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start border-t border-gray-800 sm:border-0 pt-3 sm:pt-0">
          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${item.uygulama?.toLowerCase().includes('gastro') ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-blue-900/40 text-blue-300 border-blue-700'}`}>
            {item.uygulama || "Diğer"}
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => duzenleModunuAc(item)} className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded hover:bg-blue-800 transition">Düzenle</button>
            <button onClick={() => kayıtSil(item.id)} className="text-[10px] bg-red-900/50 text-red-300 px-2 py-1 rounded hover:bg-red-800 transition">Sil</button>
          </div>
        </div>
      </div>

      {item.aciklama && item.aciklama.trim() && (
        <p className="mt-3 text-sm bg-gray-800 p-2 rounded text-gray-300 border border-gray-700 whitespace-pre-line">{item.aciklama}</p>
      )}

      {item.dosyalar?.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <span className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Ekteki Dosyalar ({item.dosyalar.length})</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {item.dosyalar.map((url, i) => (
              <div key={i} className="bg-gray-950 p-1.5 rounded-lg border border-gray-800 hover:border-emerald-700 transition-colors">
                <button type="button" onClick={() => setActiveModalUrl(url)} className="w-full h-[40px] flex items-center justify-center text-xl overflow-hidden rounded bg-gray-900">
                  {['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => url.toLowerCase().endsWith(ext)) 
                    ? <img src={url} alt="Ek" className="w-full h-full object-cover" loading="lazy" />
                    : <span className="opacity-80">{dosyaIkonuVer(url)}</span>}
                </button>
                <p className="mt-1.5 text-[9px] text-gray-400 truncate text-center px-1">{dosyaAdiniAyıkla(url)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Çok kritik: Sadece ilgili veriler değiştiğinde yeniden render et!
export default memo(CagriKarti, (prev, next) => {
  return (
    prev.item.id === next.item.id && 
    prev.genisletilmisId === next.genisletilmisId &&
    prev.item.aciklama === next.item.aciklama &&
    prev.item.tel === next.item.tel && // Tel değişirse güncelle
    prev.item.firma === next.item.firma && // Firma değişirse güncelle
    prev.item.dosyalar?.length === next.item.dosyalar?.length // Dosya sayısı değişirse güncelle
  );
});