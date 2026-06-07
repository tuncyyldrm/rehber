'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AsistanCRM() {
  const [searchTel, setSearchTel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Kamera ve OCR Stateleri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    tel: '', firma: '', kisi: '', uygulama: 'Gastropos', aciklama: '', dosyalar: []
  });

  // Debounce (Gecikmeli Arama) + Form Otomatik Doldurma
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTel.length >= 3) {
        araMusteri(searchTel);
        if (/^\d+$/.test(searchTel.trim()) && (!formData.tel || formData.tel === searchTel.trim())) {
          setFormData(prev => ({ ...prev, tel: searchTel.trim() }));
        }
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTel]);

  // Pano (Clipboard) Dinleyicisi
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const hamMetin = text.trim();
        const sadeceRakamMi = /^\d+$/.test(hamMetin);

        if (sadeceRakamMi && hamMetin.length >= 10 && hamMetin !== searchTel && !editingId) {
          setSearchTel(hamMetin);
          if (!formData.firma && !formData.kisi) {
            setFormData(prev => ({ ...prev, tel: hamMetin }));
          }
        }
      } catch (err) {
        console.log("Pano okuma izni alınamadı.");
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [searchTel, editingId, formData.firma, formData.kisi]);

  // Hibrit Arama Fonksiyonu
  const araMusteri = async (metin) => {
    setLoading(true);
    const aranacakMetin = metin.trim();

    let query = supabase.from('musteriler').select('*').eq('is_deleted', false);

    if (/^\d+$/.test(aranacakMetin)) {
      query = query.ilike('tel', `%${aranacakMetin}%`);
    } else {
      query = query.or(`firma.ilike.%${aranacakMetin}%,kisi.ilike.%${aranacakMetin}%`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  // iOS ve Android Uyumlu Kamera Açma
  const kamerayiAc = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Kamera izni alınamadı veya cihazda kamera bulunamadı.");
      setIsCameraOpen(false);
    }
  };

  // Kamerayı Kapatma
  const kamerayiKapat = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  // Butonla Yakalama ve Esnek Telefon No Süzme İşlemi (OCR)
  const fotografiCekVeOku = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setOcrLoading(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Video karesini yüksek kalitede canvas'a aktar
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Tesseract ile metin çözme
      const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng');

      // Harf, boşluk ve sembolleri temizle, sadece saf rakamlar kalsın
      const temizRakamlar = text.replace(/\D/g, '');

      // Akıllı Telefon Yakalama Motoru (05xx..., 905xx... veya direkt 5xx... kalıplarını bulur)
      const telefonBulucu = temizRakamlar.match(/(95\d{10}|905\d{9}|05\d{9}|5\d{9})/);

      if (telefonBulucu) {
        const yakalananNumara = telefonBulucu[0];
        
        // Numarayı doğrudan arama çubuğuna ve form alanına gönderiyoruz
        setSearchTel(yakalananNumara);
        setFormData(prev => ({ ...prev, tel: yakalananNumara }));
        
        // İşlem başarılı, kamerayı kapatıp otomatik aramayı başlatıyoruz
        kamerayiKapat();
      } else {
        alert(`Uygun formatta bir telefon numarası seçilemedi.\nOkunan Ham Metin: ${text.trim()}`);
      }
    } catch (error) {
      alert("Okuma hatası oluştu: " + error.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Görsel Sıkıştırma Motoru
  const gorseliSikistir = (file) => {
    return new Promise((resolve) => {
      const okuyucu = new FileReader();
      okuyucu.readAsDataURL(file);
      okuyucu.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_BOYUT = 1280;
          if (width > height) {
            if (width > MAX_BOYUT) {
              height *= MAX_BOYUT / width;
              width = MAX_BOYUT;
            }
          } else {
            if (height > MAX_BOYUT) {
              width *= MAX_BOYUT / height;
              height = MAX_BOYUT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          ctx.canvas.toBlob((blob) => {
            const sikistirilmisDosya = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(sikistirilmisDosya);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleCokluDosyaYukle = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);

      const yuklenenLinkler = [];
      const files = Array.from(e.target.files);

      for (let file of files) {
        const gorselMi = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type);
        if (gorselMi) {
          file = await gorseliSikistir(file);
        }

        const temizIsim = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const dosyaAdi = `${Date.now()}-${temizIsim}`;

        const { data, error } = await supabase.storage
          .from('cagri-gorselleri')
          .upload(dosyaAdi, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('cagri-gorselleri')
          .getPublicUrl(dosyaAdi);

        yuklenenLinkler.push(publicUrlData.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        dosyalar: [...prev.dosyalar, ...yuklenenLinkler]
      }));

      alert(`${files.length} dosya işlenerek başarıyla eklendi!`);
    } catch (error) {
      alert("Dosya yüklenirken hata oluştu: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const yuklenenDosyayiKaldir = (indexDosya) => {
    setFormData(prev => ({
      ...prev,
      dosyalar: prev.dosyalar.filter((_, i) => i !== indexDosya)
    }));
  };

  const handleKayıtSubmit = async (e) => {
    e.preventDefault();

    const telefon = formData.tel.trim();
    const firmaAdi = formData.firma.trim();
    const kisiAdi = formData.kisi.trim();

    if (!telefon) return alert("Hata: Telefon numarası zorunludur!");
    if (!/^\d+$/.test(telefon)) return alert("Hata: Telefon numarası sadece rakamlardan oluşmalıdır!");
    if (telefon.length < 10) return alert(`Hata: Telefon numarası eksik! En az 10 hane olmalıdır.`);
    if (!firmaAdi) return alert("Hata: Firma Alanı boş bırakılamaz!");
    if (!kisiAdi) return alert("Hata: Görüştüğünüz Kişi alanı boş bırakılamaz!");

    const gonderilecekVeri = {
      ...formData,
      tel: telefon,
      firma: firmaAdi,
      kisi: kisiAdi
    };

    if (editingId) {
      const { error } = await supabase
        .from('musteriler')
        .update(gonderilecekVeri)
        .eq('id', editingId);

      if (!error) {
        alert("Kayıt başarıyla güncellendi!");
        setEditingId(null);
        araMusteri(searchTel || telefon);
        setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Gastropos', aciklama: '', dosyalar: [] });
      } else {
        alert("Güncelleme hatası: " + error.message);
      }
    } else {
      const { error } = await supabase
        .from('musteriler')
        .insert([gonderilecekVeri]);

      if (!error) {
        alert("Çağrı başarıyla kaydedildi!");
        setSearchTel(telefon);
        setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Gastropos', aciklama: '', dosyalar: [] });
      } else {
        alert("Kayıt hatası: " + error.message);
      }
    }
  };

  const duzenleModunuAc = (item) => {
    setEditingId(item.id);
    setFormData({
      tel: item.tel,
      firma: item.firma || '',
      kisi: item.kisi || '',
      uygulama: item.uygulama || 'Gastropos',
      aciklama: item.aciklama || '',
      dosyalar: item.dosyalar || []
    });
  };

  const kayıtSil = async (id) => {
    if (!confirm("Bu çağrı kaydını silmek istediğinize emin misiniz?")) return;
    
    const { error } = await supabase
      .from('musteriler')
      .update({ is_deleted: true }) 
      .eq('id', id);

    if (!error) {
      alert("Kayıt başarıyla arşive kaldırıldı.");
      araMusteri(searchTel);
    } else {
      alert("Silme işlemi sırasında hata oluştu: " + error.message);
    }
  };

  const sablonEkle = (metin) => {
    setFormData(prev => ({
      ...prev,
      aciklama: prev.aciklama ? `${prev.aciklama}\n${metin}` : metin
    }));
  };

  const dosyaAdiniAyıkla = (url) => {
    try {
      const hamIsim = url.split('/').pop();
      const temizIsim = hamIsim.replace(/^\d+-/, '');
      return decodeURIComponent(temizIsim);
    } catch {
      return "Bilinmeyen_Dosya";
    }
  };

  const dosyaIkonuVer = (url) => {
    const uzanti = url.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(uzanti)) return '🖼️';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(uzanti)) return '🎬';
    if (['zip', 'rar', '7z', 'tar'].includes(uzanti)) return '📦';
    if (['txt', 'log'].includes(uzanti)) return '📄';
    return '📁';
  };

  // VERİ SETİ MOTORU
  const benzersizOneriler = [];
  const gorulenKombinasyonlar = new Set();

  results.forEach(item => {
    const tel = item.tel?.trim() || '';
    const firma = item.firma?.trim() || '';
    const kisi = item.kisi?.trim() || '';
    
    const key = `${tel}-${firma}-${kisi}`;
    
    if (!gorulenKombinasyonlar.has(key) && (tel || firma || kisi)) {
      gorulenKombinasyonlar.add(key);
      benzersizOneriler.push({ tel, firma, kisi });
    }
  });

  const gosterilecekOneriler = benzersizOneriler.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <header className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Reh-ber</h1>
          <p className="text-sm text-gray-400 mt-1">Çağrı Asistanı & Hızlı Sorgu.</p>
        </div>
        {loading && <span className="text-sm text-amber-400 animate-pulse">⚡ Aranıyor...</span>}
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SOL PANEL: ARAMA VE GEÇMİŞ */}
        <div className="lg:col-span-7 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">🔍 Akıllı Arama Çubuğu</h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Numara, firma adı veya kişi yazın..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 pr-12 text-xl font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500"
                value={searchTel}
                onChange={(e) => setSearchTel(e.target.value)}
              />
              {searchTel && (
                <button
                  type="button"
                  onClick={() => { setSearchTel(''); setResults([]); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={isCameraOpen ? kamerayiKapat : kamerayiAc}
              className={`px-4 rounded-lg font-medium text-sm transition flex items-center gap-1 shrink-0 ${isCameraOpen ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {isCameraOpen ? '✕ Kapat' : '📷 Kameradan Oku'}
            </button>
          </div>

          {/* KAMERA ALANI */}
          {isCameraOpen && (
            <div className="mt-4 bg-gray-950 p-4 rounded-xl border border-gray-700 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden border border-gray-600">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-12 border-2 border-dashed border-emerald-400 rounded pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] bg-gray-900/90 px-2 text-emerald-400 font-mono tracking-wider">NUMARAYI BURAYA HIZALAYIN</span>
                </div>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />

              <button
                type="button"
                disabled={ocrLoading}
                onClick={fotografiCekVeOku}
                className="mt-4 w-full max-w-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 text-gray-900 font-bold p-3 rounded-lg transition text-center shadow font-sans"
              >
                {ocrLoading ? '⚡ Numara Süzülüyor...' : '🎯 Numarayı Yakala ve Ara'}
              </button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sonuçlar / Çağrı Geçmişi ({results.length})</h3>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                {searchTel.length < 3 ? "Arama yapmak için en az 3 karakter girin." : "Eşleşen bir kayıt bulunamadı."}
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {results.map((item) => (
                  <div key={item.id} className="bg-gray-900 p-4 rounded-lg border-l-4 border-emerald-500 shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(item.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <h4 className="text-lg font-bold text-white uppercase mt-1 truncate">{item.firma || "Bilinmeyen Firma"}</h4>
                        <p className="text-sm text-gray-300">Yetkili: <span className="font-semibold">{item.kisi || "Belirtilmemiş"}</span></p>

                        <a href={`tel:${item.tel}`} className="inline-flex items-center text-xs text-emerald-400 hover:underline mt-2 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800 w-auto">
                          📞 {item.tel} (Geri Ara)
                        </a>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                        <span className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${item.uygulama?.toLowerCase().includes('gastro') ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-blue-900/60 text-blue-300 border border-blue-700'}`}>
                          {item.uygulama}
                        </span>

                        <div className="flex gap-1.5 mt-auto sm:mt-1">
                          <button onClick={() => duzenleModunuAc(item)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded shadow font-medium transition">📝 Düzenle</button>
                          <button onClick={() => kayıtSil(item.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2.5 py-1 rounded shadow font-medium transition">🗑️ Sil</button>
                        </div>
                      </div>
                    </div>

                    {item.aciklama && (
                      <p className="mt-3 text-sm bg-gray-800 p-2 rounded text-gray-300 border border-gray-700 whitespace-pre-line">
                        {item.aciklama}
                      </p>
                    )}

                    {item.dosyalar && item.dosyalar.length > 0 && (
                      <div className="mt-4 border-t border-gray-800 pt-3">
                        <span className="text-xs text-gray-500 block mb-2">Ekteki Dosyalar ({item.dosyalar.length}):</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {item.dosyalar.map((url, i) => {
                            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => url.toLowerCase().endsWith(ext));
                            const dosyaAdi = dosyaAdiniAyıkla(url);
                            return (
                              <div key={i} className="bg-gray-800 p-2 rounded border border-gray-700 flex flex-col justify-between items-center h-[130px] text-center">
                                {isImage ? (
                                  <a href={url} target="_blank" rel="noreferrer" className="w-full flex justify-center">
                                    <img src={url} alt="Ek" className="w-full h-[65px] rounded object-cover hover:opacity-80" />
                                  </a>
                                ) : (
                                  <div className="w-full h-[65px] bg-gray-950 rounded flex items-center justify-center text-xl">
                                    {dosyaIkonuVer(url)}
                                  </div>
                                )}
                                <div className="w-full mt-1">
                                  <p className="text-[10px] text-gray-300 truncate px-1" title={dosyaAdi}>
                                    {dosyaAdi}
                                  </p>
                                  <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline block mt-0.5 font-semibold">
                                    📥 İndir / Aç
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: FORM */}
        <div className="lg:col-span-5 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            {editingId ? "📝 Kaydı Düzenle" : "📞 Yeni Çağrı / Talep Logla"}
            {editingId && <button onClick={() => { setEditingId(null); setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Gastropos', aciklama: '', dosyalar: [] }); }} className="ml-2 text-xs text-red-400 underline">İptal</button>}
          </h2>

          <form onSubmit={handleKayıtSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Telefon *</label>
              <input
                type="text"
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              />
            </div>

            {/* ÇOKLU VERİ SETİ ÖNERİ ALANI */}
            {!editingId && gosterilecekOneriler.length > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-800 p-3 rounded-lg text-xs space-y-2">
                <span className="text-emerald-400 font-semibold block">💡 Geçmiş Kayıtlardan Eşleşen Veri Setleri:</span>
                <div className="grid grid-cols-1 gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {gosterilecekOneriler.map((oneri, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full bg-gray-900/80 hover:bg-gray-900 border border-emerald-800/40 hover:border-emerald-500 p-2 rounded text-left transition flex items-center justify-between gap-2 group"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tel: oneri.tel,
                        firma: oneri.firma,
                        kisi: oneri.kisi
                      }))}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 flex-1 text-gray-300">
                        <span className="font-mono text-emerald-400 font-bold shrink-0">📞 {oneri.tel}</span>
                        {oneri.firma && <span className="font-medium truncate max-w-[130px]">🏢 {oneri.firma}</span>}
                        {oneri.kisi && <span className="text-gray-400 truncate max-w-[100px]">👤 {oneri.kisi}</span>}
                      </div>
                      <span className="text-[10px] bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded font-medium shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition">
                        ⚡ Seç
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Firma Adı *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  value={formData.firma}
                  onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Görüştüğünüz Kişi *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  value={formData.kisi}
                  onChange={(e) => setFormData({ ...formData, kisi: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Kullandığı Uygulama / Cihaz</label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                value={formData.uygulama}
                onChange={(e) => setFormData({ ...formData, uygulama: e.target.value })}
              >
                <option value="Gastropos">Gastropos</option>
                <option value="M320 Medusa">M320 Medusa</option>
                <option value="M320">M320</option>
                <option value="Zen2o">Zen2o</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Dosya Ekle</label>
              <input
                type="file"
                multiple
                onChange={handleCokluDosyaYukle}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-emerald-400 hover:file:bg-gray-600 cursor-pointer"
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-amber-400 mt-1 animate-pulse">Dosyalar işleniyor...</p>}

              {formData.dosyalar.length > 0 && (
                <div className="mt-2 p-2 bg-gray-900 rounded border border-gray-700 space-y-1.5 max-h-[160px] overflow-y-auto">
                  {formData.dosyalar.map((url, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-800 p-1.5 rounded px-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <span>{dosyaIkonuVer(url)}</span>
                        <span className="truncate text-gray-300 font-mono text-[11px]" title={dosyaAdiniAyıkla(url)}>
                          {dosyaAdiniAyıkla(url)}
                        </span>
                      </div>
                      <button type="button" onClick={() => yuklenenDosyayiKaldir(index)} className="text-red-400 hover:text-red-300 text-[10px] font-bold shrink-0">✕ Kaldır</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Talep Detayı</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button type="button" onClick={() => sablonEkle("Uzak bağlantı ile sorun çözüldü.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300">⚙️ Çözüldü</button>
                <button type="button" onClick={() => sablonEkle("Lisans güncellemesi yapıldı.")} className="text-[11px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300">🔑 Lisans</button>
                <button type="button" onClick={() => sablonEkle("Dönüş yapılacak, bekleniyor.")} className="text-[11px] bg-amber-950/40 border border-amber-800 text-amber-300 px-2 py-1 rounded">⏳ Beklemede</button>
              </div>

              <textarea
                rows="4"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-600"
                placeholder="Müşteri ne talep etti? Hangi sorun çözüldü?"
                value={formData.aciklama}
                onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold p-3 rounded-lg transition shadow-md"
            >
              {editingId ? "Değişiklikleri Kaydet" : "Çağrıyı Sisteme Kaydet"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}