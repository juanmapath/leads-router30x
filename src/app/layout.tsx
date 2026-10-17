import type { ReactNode } from 'react';

export const metadata = {
  title: 'Jev Lead Router · 30X',
  description: 'Decisiones calibradas con Jev para enrutar los leads de 30X.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', background: '#0b0b0c', color: '#f4f4f5' }}>
        {children}
      </body>
    </html>
  );
}
