import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Jev Lead Router · 30X',
  description: 'Decisiones calibradas con Jev para enrutar los leads de 30X.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
