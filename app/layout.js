import './globals.css';

// 1. Standart Metadata Ayarları
export const metadata = {
  title: 'Reh-ber Asistan',
  description: 'Teknik Destek ve Müşteri Çağrı Yönetim Paneli',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Reh-ber Asistan',
    statusBarStyle: 'black-translucent',
  },
};

// 2. Next.js Standartlarına Uygun Viewport ve Tema Rengi Dışa Aktarımı
export const viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/5608/5608610.png" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/5608/5608610.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}