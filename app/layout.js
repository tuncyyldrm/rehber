import './globals.css';

export const metadata = {
  title: '⚡ Rehber & Çağrı Asistanı',
  description: 'Teknik Destek ve Müşteri Çağrı Yönetim Paneli',
  manifest: '/manifest.json',
  themeColor: '#10b981', // Emerald yeşili üst bar (Mobilde harika görünür)
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    title: 'Rehber Asistan',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}