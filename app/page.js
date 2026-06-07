'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Tesseract from 'tesseract.js';
// En üste import'ları ekle abi
import DosyaYuklemeAlani from '@/components/DosyaYuklemeAlani';
import MedyaOnizlemeModal from '@/components/MedyaOnizlemeModal';
import KameraTaramaAlani from '@/components/KameraTaramaAlani';

// 1. Fonksiyon dışında sadece çevre değişkenleri ve Supabase client tanımlanır:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AsistanCRM() {
  // Tam ekran dosya/video önizleme state'i (Artık doğru yerde!)
  const [activeModalUrl, setActiveModalUrl] = useState(null);
  const [searchTel, setSearchTel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Kamera ve OCR Stateleri (page.js içinde kalacaklar)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [formData, setFormData] = useState({
    tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: []
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

  // SADECE State'i yönetiyoruz, donanımı (kamera) yönetmiyoruz!
  const kamerayiAc = () => {
    setIsCameraOpen(true);
  };

  // SADECE State'i yönetiyoruz
  const kamerayiKapat = () => {
    setIsCameraOpen(false);
  };

  // Dışarıdan yakalanan görseli alan yeni OCR motoru
  const handleOcrOku = async (base64Gorsel) => {
    setOcrLoading(true);

    try {
      // Tesseract ile metin çözme (Görsel bileşenden base64 olarak akıyor)
      const { data: { text } } = await Tesseract.recognize(base64Gorsel, 'eng');

      // Harf, boşluk ve sembolleri temizle, sadece saf rakamlar kalsın
      const temizRakamlar = text.replace(/\D/g, '');

      // Akıllı Telefon Yakalama Motoru (05xx..., 905xx... veya direkt 5xx... kalıplarını bulur)
      const telefonBulucu = temizRakamlar.match(/(95\d{10}|905\d{9}|05\d{9}|5\d{9})/);

      if (telefonBulucu) {
        let yakalananNumara = telefonBulucu[0];

        // Eğer numara 905 ile başlıyorsa (12 haneliyse), başındaki 90'ı atıp 05 yapıyoruz
        if (yakalananNumara.startsWith('905') && yakalananNumara.length === 12) {
          yakalananNumara = '0' + yakalananNumara.slice(2); // 90531... -> 0531... yapar
        }
        // Eğer numara sadece 95 ile başlıyorsa (11 haneliyse)
        else if (yakalananNumara.startsWith('95') && yakalananNumara.length === 11) {
          yakalananNumara = '0' + yakalananNumara.slice(1); // 9531... -> 0531... yapar
        }

        // Arama çubuğuna ve forma tertemiz 11 haneli (05xx) formatı basıyoruz
        setSearchTel(yakalananNumara);
        setFormData(prev => ({ ...prev, tel: yakalananNumara }));

        // Kamerayı kapatma fonksiyonunu burada tetikliyoruz
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
      // 1. DURUM: BAĞLANTI (PASTE / CTRL+V) SÜZGECİ
      // Eğer fonksiyon bir yapıştırma olayıyla (onPaste) tetiklendiyse
      if (e.clipboardData) {
        const pastedText = e.clipboardData.getData('text');

        // Yapıştırılan metin bir YouTube linki mi?
        if (pastedText && (pastedText.includes('youtube.com') || pastedText.includes('youtu.be'))) {
          e.preventDefault(); // Tarayıcının varsayılan metin yapıştırma hareketini durdur

          setFormData(prev => ({
            ...prev,
            dosyalar: [...prev.dosyalar, pastedText.trim()]
          }));

          alert("🎬 YouTube video bağlantısı başarıyla eklendi!");
          return;
        }
      }

      // 2. DURUM: DOSYA SEÇİMİ VEYA EKRAN GÖRÜNTÜSÜ (PASTE BLOB) SÜZGECİ
      // Input'tan dosya seçildiyse e.target.files, Ctrl+V ile görsel yapıştırıldıysa e.clipboardData.files kullanılır
      const rawFiles = e.target?.files || e.clipboardData?.files;
      if (!rawFiles || rawFiles.length === 0) return;

      if (e.clipboardData) e.preventDefault(); // Görsel yapıştırıldıysa input kutusuna parazit metin girmesini engelle

      setUploading(true);
      const yuklenenLinkler = [];
      const files = Array.from(rawFiles);

      for (let file of files) {
        // Görsel Kontrolü (Ekran görüntüleri otomatik olarak 'image/png' formatında gelir)
        const gorselMi = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type);
        if (gorselMi) {
          file = await gorseliSikistir(file);
        }

        // Dosya adı temizleme (Ekran görüntülerinde 'image.png' veya 'clipboard.png' olur)
        const temizIsim = file.name ? file.name.replace(/[^a-zA-Z0-9.]/g, "_") : `ekran_goruntusu_${Date.now()}.png`;
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

      alert(`${files.length} öge işlenerek başarıyla eklendi!`);
    } catch (error) {
      alert("İşlem yapılırken hata oluştu: " + error.message);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ""; // Input değerini sıfırla
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

  const duzenleModunuAc = (item) => {
    setEditingId(item.id);
    setFormData({
      tel: item.tel,
      firma: item.firma || '',
      kisi: item.kisi || '',
      uygulama: item.uygulama || 'Diğer',
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

  // YouTube linklerini güvenli embed (gömülü) oynatıcı linkine dönüştürür
  const youtubeEmbedUrlVer = (url) => {
    if (!url) return '';
    let videoId = '';

    // Normal youtube.com/watch?v=VIDEO_ID formatı için
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    }
    // Mobil veya kısa youtu.be/VIDEO_ID formatı için
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // embedded format zaten gelmişse
    else if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
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

          {/* KAMERA ALANI */}
          <KameraTaramaAlani
            isCameraOpen={isCameraOpen}
            ocrLoading={ocrLoading}
            onCapture={handleOcrOku} // Canvas'tan üretilen base64 buraya paslanıyor
          />
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sonuçlar / Çağrı Geçmişi ({results.length})</h3>

            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                {searchTel.length < 3 ? "Arama yapmak için en az 3 karakter girin." : "Eşleşen bir kayıt bulunamadı."}
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
                {results.map((item) => (
                  // En dış kutuda "w-full overflow-hidden" kartın dışarı taşmasını kesin olarak engeller
                  <div key={item.id} className="bg-gray-900 p-4 rounded-lg border-l-4 border-emerald-500 shadow w-full overflow-hidden">

                    {/* İçerik ve butonları taşıyan ana esnek kutu. Mobilde alt alta, sm ekranda yan yana */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3 w-full min-w-0">

                      {/* Sol Taraf: Metinlerin olduğu alan. "w-full min-w-0" truncate'in çalışması için zorunludur */}
                      <div className="w-full min-w-0 flex-1">
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(item.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Firma Başlığı Kapsayıcısı */}
                        <div className="group relative w-full min-w-0 mt-1">
                          <h4
                            onClick={(e) => {
                              // Tıklayınca kesme özelliğini aç/kapat yapar
                              e.currentTarget.classList.toggle('whitespace-normal');
                              e.currentTarget.classList.toggle('truncate');
                            }}
                            className="text-lg font-bold text-white uppercase truncate cursor-pointer transition-all duration-200 select-none hover:text-emerald-400 block w-full"
                            title="Tam ismi görmek için tıklayın"
                          >
                            {item.firma || "Bilinmeyen Firma"}
                          </h4>

                          {/* MASAÜSTÜ İÇİN HOVER TAM METİN BALONCUĞU (TOOLTIP) */}
                          <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-50 max-w-xs sm:max-w-md bg-gray-950 text-gray-200 text-xs p-2 rounded-md shadow-xl border border-gray-700 font-sans font-normal normal-case pointer-events-none whitespace-normal">
                            {item.firma || "Bilinmeyen Firma"}
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 mt-1 truncate">
                          Yetkili: <span className="font-semibold">{item.kisi || "Belirtilmemiş"}</span>
                        </p>

                        <a href={`tel:${item.tel}`} className="inline-flex items-center text-xs text-emerald-400 hover:underline mt-2 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800 w-auto">
                          📞 {item.tel} (Ara)
                        </a>
                      </div>

                      {/* Sağ Taraf: Uygulama Etiketi ve Düzenle/Sil Butonları */}
                      <div className="flex sm:flex-col items-end gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start border-t border-gray-800 sm:border-0 pt-2 sm:pt-0">
                        <span className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${item.uygulama?.toLowerCase().includes('gastro') ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-blue-900/60 text-blue-300 border border-blue-700'}`}>
                          {item.uygulama || "Diğer"}
                        </span>

                        <div className="flex gap-1.5 mt-auto sm:mt-1">
                          <button onClick={() => duzenleModunuAc(item)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded shadow font-medium transition shrink-0">📝 Düzenle</button>
                          <button onClick={() => kayıtSil(item.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-2.5 py-1 rounded shadow font-medium transition shrink-0">🗑️ Sil</button>
                        </div>
                      </div>

                    </div>

                    {/* Açıklama Alanı */}
                    {item.aciklama && item.aciklama.trim() && (
                      <p className="mt-3 text-sm bg-gray-800 p-2 rounded text-gray-300 border border-gray-700 whitespace-pre-line overflow-hidden text-ellipsis">
                        {item.aciklama}
                      </p>
                    )}
                    {/* Dosyalar Alanı - Mobilde de görünürlük artırıldı */}
                    {item.dosyalar && item.dosyalar.length > 0 && (
                      <div className="mt-4 border-t border-gray-800 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ekteki Dosyalar ({item.dosyalar.length})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {item.dosyalar.map((url, i) => {
                            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => url.toLowerCase().endsWith(ext));
                            const dosyaAdi = dosyaAdiniAyıkla(url);

                            return (
                              <div key={i} className="relative bg-gray-950 p-1.5 rounded-lg border border-gray-800 hover:border-emerald-700 transition-colors group">
                                <button
                                  type="button"
                                  onClick={() => setActiveModalUrl(url)}
                                  className="w-full h-[40px] flex items-center justify-center text-xl overflow-hidden rounded bg-gray-900 border border-gray-800"
                                >
                                  {isImage ? (
                                    <img src={url} alt="Ek" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="opacity-80">{dosyaIkonuVer(url)}</span>
                                  )}
                                </button>
                                <p className="mt-1.5 text-[9px] text-gray-400 truncate text-center px-1">
                                  {dosyaAdi}
                                </p>
                                {/* Mobilde her zaman görünen minik bir gösterge */}
                                <div className="absolute top-1 right-1 bg-emerald-900/80 text-white text-[8px] px-1 rounded sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  🔍
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
          <h2 className="text-md font-semibold mb-4 text-gray-200">
            {editingId ? "📝 Kaydı Düzenle" : "📞 Yeni Çağrı / Talep Logla"}
            {editingId && <button onClick={() => { setEditingId(null); setFormData({ tel: '', firma: '', kisi: '', uygulama: 'Diğer', aciklama: '', dosyalar: [] }); }} className="ml-2 text-xs text-red-400 underline">İptal</button>}
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
  <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs space-y-1">
    <div className="grid grid-cols-1 gap-1">
      {gosterilecekOneriler.map((oneri, idx) => {
        const isSelected = formData.tel === oneri.tel;
        
        return (
          <button
            key={idx}
            type="button"
            className={`w-full p-2 rounded text-left flex items-center justify-between border ${
              isSelected ? "bg-emerald-900 border-emerald-500" : "bg-gray-800 border-gray-700 hover:border-gray-500"
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
                <label className="block text-sm font-medium text-gray-400 mb-1">Kişi *</label>
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
      {/* Sayfanın en altına (main kapanışının hemen önüne) da pop-up bileşenini bırakıyorsun: */}
      <MedyaOnizlemeModal
        activeModalUrl={activeModalUrl}
        setActiveModalUrl={setActiveModalUrl}
        dosyaAdiniAyıkla={dosyaAdiniAyıkla}
        dosyaIkonuVer={dosyaIkonuVer}
      />
    </div>
  );
}