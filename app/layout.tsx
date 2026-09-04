import type { Metadata } from 'next';
import './globals.css';
import './research-expansion.css';

export const metadata: Metadata = {
  title: 'Mithila–Vajji–Anga | Videha Historical Research',
  description:
    'A scholarly research portal for the connected histories of Mithila, Vajji, and Anga across India and Nepal.',
  icons: { icon: './favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
