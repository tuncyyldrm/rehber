import React, { useRef, useEffect } from 'react'; // useRef ve useEffect'i ekledik
import DosyaYuklemeAlani from './DosyaYuklemeAlani';

export default function CagriFormu({
    formData, setFormData, handleKayıtSubmit, editingId, setEditingId,
    uploading, handleCokluDosyaYukle, dosyaIkonuVer, dosyaAdiniAyıkla,
    yuklenenDosyayiKaldir, setActiveModalUrl, sablonEkle
}) {
    const textareaRef = useRef(null);
// Metin harici durumlarda (şablon ekleme veya editingId değişimi) 
  // textarea yüksekliğini güncel tutar
useEffect(() => {
  if (textareaRef.current) {
    if (!formData.aciklama) {
      textareaRef.current.style.height = 'auto'; // İçerik boşsa sıfırla
    } else {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }
}, [formData.aciklama]);
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
            <h2 className="text-md font-semibold mb-4 text-gray-200">
                {editingId ? "📝 Kaydı Düzenle" : "📞 Yeni Çağrı / Talep Logla"}
                {editingId && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: [] });
                        }}
                        className="ml-2 text-xs text-red-400 underline"
                    >
                        İptal
                    </button>
                )}
            </h2>

            <form onSubmit={handleKayıtSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Telefon *</label>
                    <input
                        type="text" required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        value={formData.tel}
                        onChange={(e) => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Firma Adı *</label>
                        <input
                            type="text" required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            value={formData.firma}
                            onChange={(e) => setFormData(prev => ({ ...prev, firma: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kişi *</label>
                        <input
                            type="text" required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            value={formData.kisi}
                            onChange={(e) => setFormData(prev => ({ ...prev, kisi: e.target.value }))}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Kullandığı Uygulama / Cihaz</label>
                    <select
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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

                <DosyaYuklemeAlani
                    handleCokluDosyaYukle={handleCokluDosyaYukle}
                    uploading={uploading}
                    formData={formData}
                    dosyaIkonuVer={dosyaIkonuVer}
                    dosyaAdiniAyıkla={dosyaAdiniAyıkla}
                    yuklenenDosyayiKaldir={yuklenenDosyayiKaldir}
                    setActiveModalUrl={setActiveModalUrl}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Talep Detayı</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        <button type="button" onClick={() => sablonEkle("Uzak bağlantı ile sorun çözüldü.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300">⚙️ Çözüldü</button>
                        <button type="button" onClick={() => sablonEkle("Lisans güncellemesi yapıldı.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300">🔑 Lisans</button>
                        <button type="button" onClick={() => sablonEkle("Dönüş yapılacak, bekleniyor.")} className="text-[11px] bg-amber-950/40 border border-amber-800 text-amber-300 px-2 py-1 rounded">⏳ Beklemede</button>
                    </div>
<textarea
  ref={textareaRef}
  rows="4"
  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none overflow-hidden"
  value={formData.aciklama}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, aciklama: e.target.value }));
    
    // Otomatik genişleme mantığı
    e.target.style.height = 'auto'; // Önce yüksekliği sıfırla
    e.target.style.height = `${e.target.scrollHeight}px`; // İçerik kadar uzat
  }}
/>
                </div>
                <button
                    type="submit"
                    disabled={uploading} // Yükleme sürerken formu gönderememeli
                    className={`w-full p-3 rounded-lg font-semibold transition ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}
                >
                    {uploading ? "İşleniyor..." : (editingId ? "Değişiklikleri Kaydet" : "Çağrıyı Sisteme Kaydet")}
                </button>
            </form>
        </div>
    );
}