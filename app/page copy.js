'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';

import MedyaOnizlemeModal from '@/components/MedyaOnizlemeModal';
import KameraTaramaAlani from '@/components/KameraTaramaAlani';
import CagriKarti from '@/components/CagriKarti';
import CagriFormu from '@/components/CagriFormu';

// 1. Çevre değişkenleri ve Supabase client tanımlanır:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AsistanCRM() {
  // 1. TÜM STATE TANIMLAMALARI (Sıralı ve Eksiksiz)
  const [activeModalUrl, setActiveModalUrl] = useState(null);
  const [searchTel, setSearchTel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [genisletilmisId, setGenisletilmisId] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [formData, setFormData] = useState({
    tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: []
  });

  const formRef = useRef(null);

  // Arama Motoru
  const araMusteri = useCallback(async (metin) => {
    const aranacakMetin = metin?.trim();
    setLoading(true);

    let query = supabase
      .from('musteriler')
      .select('id, tel, firma, kisi, uygulama, aciklama, dosyalar, created_at')
      .eq('is_deleted', false);

    if (aranacakMetin) {
      // Tarih araması mı? (YYYY-MM-DD formatı)
      if (/^\d{4}-\d{2}-\d{2}$/.test(aranacakMetin)) {
        query = query.gte('created_at', `${aranacakMetin}T00:00:00Z`)
                     .lte('created_at', `${aranacakMetin}T23:59:59Z`);
      } 
      // Telefon araması mı?
      else if (/^\d+$/.test(aranacakMetin)) {
        query = query.ilike('tel', `%${aranacakMetin}%`);
      } 
      // İsim veya firma araması mı?
      else {
        query = query.or(`firma.ilike.%${aranacakMetin}%,kisi.ilike.%${aranacakMetin}%`);
      }
    }

    const { data } = await query.order('created_at', { ascending: false }).limit(20);
    setResults(data || []);
    setLoading(false);
  }, []);

  // Debounce (Gecikmeli Arama) Motoru
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTel.length >= 3) {
        araMusteri(searchTel);
      } else {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTel, araMusteri]);

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

  const kamerayiAc = () => setIsCameraOpen(true);
  const kamerayiKapat = () => setIsCameraOpen(false);

  // OCR Motoru
  const handleOcrOku = async (base64Gorsel) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(base64Gorsel, 'eng');
      const temizRakamlar = text.replace(/\D/g, '');
      const telefonBulucu = temizRakamlar.match(/(95\d{10}|905\d{9}|05\d{9}|5\d{9})/);

      if (telefonBulucu) {
        let yakalananNumara = telefonBulucu[0];

        if (yakalananNumara.startsWith('905') && yakalananNumara.length === 12) {
          yakalananNumara = '0' + yakalananNumara.slice(2);
        } else if (yakalananNumara.startsWith('95') && yakalananNumara.length === 11) {
          yakalananNumara = '0' + yakalananNumara.slice(1);
        }

        setSearchTel(yakalananNumara);
        setFormData(prev => ({ ...prev, tel: yakalananNumara }));
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

  // Çoklu Dosya & Ekran Görüntüsü / Link Yükleme Motoru
  const handleCokluDosyaYukle = async (e) => {
    try {
      if (e.clipboardData) {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText && (pastedText.includes('youtube.com') || pastedText.includes('youtu.be'))) {
          e.preventDefault();
          setFormData(prev => ({
            ...prev,
            dosyalar: [...prev.dosyalar, pastedText.trim()]
          }));
          alert("🎬 YouTube video bağlantısı başarıyla eklendi!");
          return;
        }
      }

      const rawFiles = e.target?.files || e.clipboardData?.files || e.dataTransfer?.files;
      if (!rawFiles || rawFiles.length === 0) return;

      if (e.clipboardData) e.preventDefault();

      setUploading(true);
      const yuklenenLinkler = [];
      const files = Array.from(rawFiles);

      for (let file of files) {
        const gorselMi = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type);
        if (gorselMi) {
          file = await gorseliSikistir(file);
        }

        const temizIsim = file.name ? file.name.replace(/[^a-zA-Z0-9.]/g, "_") : `ekran_goruntusu_${Date.now()}.png`;
        const dosyaAdi = `${Date.now()}-${temizIsim}`;

        const { error } = await supabase.storage
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

      alert(`${files.length} öge işlenerek başarıyla eklendi!`);
    } catch (error) {
      alert("İşlem yapılırken hata oluştu: " + error.message);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
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
        setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: [] });
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
        setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: [] });
      } else {
        alert("Kayıt hatası: " + error.message);
      }
    }
  };

  const duzenleModunuAc = useCallback((item) => {
    setEditingId(item.id);
    setFormData({
      tel: item.tel,
      firma: item.firma || '',
      kisi: item.kisi || '',
      uygulama: item.uygulama || 'Diğer',
      aciklama: item.aciklama || '',
      dosyalar: item.dosyalar || []
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const kayıtSil = useCallback(async (id) => {
    if (!confirm("Bu çağrı kaydını arşive kaldırmak istediğinize emin misiniz?")) return;

    const { error } = await supabase
      .from('musteriler')
      .update({ is_deleted: true })
      .eq('id', id);

    if (!error) {
      alert("Kayıt başarıyla arşive kaldırıldı. (Dosyalar güvende)");
      araMusteri(searchTel);
    } else {
      alert("İşlem sırasında hata oluştu: " + error.message);
    }
  }, [searchTel, araMusteri]);

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
    // 🔥 .html ve .htm için kod/dünya ikonu eklendi, artık ayırt edilebiliyor
    if (['html', 'htm'].includes(uzanti)) return '🌐'; 
    if (['zip', 'rar', '7z', 'tar'].includes(uzanti)) return '📦';
    if (['txt', 'log', 'json', 'xml', 'yaml', 'yml'].includes(uzanti)) return '📄';
    return '📁';
  };

  // Realtime Supabase Dinleyicisi
  useEffect(() => {
    const channel = supabase
      .channel('realtime-musteriler')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'musteriler' }, payload => {
        if (payload.eventType === 'INSERT') {
          setResults(prev => [payload.new, ...prev]);
        }
        else if (payload.eventType === 'UPDATE') {
          setResults(prev => prev.map(item =>
            item.id === payload.new.id ? payload.new : item
          ));
        }
        else if (payload.eventType === 'DELETE') {
          setResults(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Kart Optimizasyonu (useMemo)
  const memoizedCards = useMemo(() => results.map((item) => (
    <CagriKarti
      key={item.id}
      item={item}
      genisletilmisId={genisletilmisId}
      setGenisletilmisId={setGenisletilmisId}
      duzenleModunuAc={duzenleModunuAc}
      kayıtSil={kayıtSil}
      setActiveModalUrl={setActiveModalUrl}
      dosyaAdiniAyıkla={dosyaAdiniAyıkla}
      dosyaIkonuVer={dosyaIkonuVer}
    />
  )), [results, genisletilmisId, duzenleModunuAc, kayıtSil]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <header className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Reh-ber <span className="text-sm text-gray-400 mt-1">Çağrı Asistanı & Hızlı Sorgu.</span></h1>
        </div>
        {loading && <span className="text-sm text-amber-400 animate-pulse">⚡ Aranıyor...</span>}
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SOL PANEL: ARAMA VE GEÇMİŞ */}
        <div className="lg:col-span-7 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-md font-semibold mb-4 text-gray-200">🔍 Akıllı Arama Çubuğu</h2>

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
              {isCameraOpen ? '✖' : '⛶'}
            </button>
          </div>

          <div className="flex gap-2 mb-4 mt-2">
            <button onClick={() => { const b = new Date().toISOString().split('T')[0]; setSearchTel(b); araMusteri(b); }} className="text-xs bg-emerald-800 px-2 py-1 rounded hover:bg-emerald-700 transition">Bugün</button>
            <button onClick={() => { const d = new Date(Date.now() - 86400000).toISOString().split('T')[0]; setSearchTel(d); araMusteri(d); }} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition">Dün</button>
          </div>

          {/* KAMERA ALANI */}
          <KameraTaramaAlani
            isCameraOpen={isCameraOpen}
            ocrLoading={ocrLoading}
            onCapture={handleOcrOku}
          />

          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sonuçlar / Çağrı Geçmişi ({results.length})</h3>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                {searchTel.length < 3 ? "Arama yapmak için en az 3 karakter girin." : "Eşleşen bir kayıt bulunamadı."}
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {memoizedCards}
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: FORM */}
        <div className="lg:col-span-5" ref={formRef}>
          <CagriFormu
            formData={formData}
            setFormData={setFormData}
            handleKayıtSubmit={handleKayıtSubmit}
            editingId={editingId}
            setEditingId={setEditingId}
            uploading={uploading}
            handleCokluDosyaYukle={handleCokluDosyaYukle}
            dosyaIkonuVer={dosyaIkonuVer}
            dosyaAdiniAyıkla={dosyaAdiniAyıkla}
            yuklenenDosyayiKaldir={yuklenenDosyayiKaldir}
            setActiveModalUrl={setActiveModalUrl}
            sablonEkle={sablonEkle}
            results={results}
          />
        </div>
      </main>

      {/* EN ALT POP-UP KATMANI */}
      <MedyaOnizlemeModal
        activeModalUrl={activeModalUrl}
        setActiveModalUrl={setActiveModalUrl}
        dosyaAdiniAyıkla={dosyaAdiniAyıkla}
        dosyaIkonuVer={dosyaIkonuVer}
      />
    </div>
  );
}