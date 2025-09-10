import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import { Toaster } from 'sonner';
import { SWRProvider } from '@/components/providers/swr-provider';
import { LoadingProvider } from '@/contexts/loading-context';

// Load Satoshi font
const satoshi = localFont({
  src: [
    {
      path: './fonts/Satoshi-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/Satoshi-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Satoshi-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Satoshi-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/Satoshi-Black.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
});

export const metadata: Metadata = {
  title: "Freelaw AI - Inteligência Jurídica",
  description: "Plataforma de inteligência artificial para profissionais do direito",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Freelaw AI",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://freelaw.ai",
    title: "Freelaw AI - Inteligência Jurídica",
    description: "Plataforma de inteligência artificial para profissionais do direito",
    siteName: "Freelaw AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Freelaw AI - Inteligência Jurídica",
    description: "Plataforma de inteligência artificial para profissionais do direito",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#6B46C1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={satoshi.variable} suppressHydrationWarning>
      <body className={`${satoshi.className || ''} antialiased`} suppressHydrationWarning>
        <LoadingProvider>
          <SWRProvider>
            {children}
            <Toaster />
          </SWRProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}