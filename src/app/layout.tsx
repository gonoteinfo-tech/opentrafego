import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Open Tráfego | Gerador de Tráfego Web Orgânico e Real',
  description: 'Aumente o tráfego do seu site de forma realista, com controle de tempo de permanência, origem das visitas (Google, Redes Sociais, Direto) e suporte total ao Google Analytics.',
  keywords: 'gerador de trafego, trafego organico, trafego google analytics, visitas site, aumentar visitas',
  authors: [{ name: 'Open Tráfego Team' }],
  openGraph: {
    title: 'Open Tráfego | Gerador de Tráfego Web Orgânico',
    description: 'Tráfego realista e monitorável no Google Analytics.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}


