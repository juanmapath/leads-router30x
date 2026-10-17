import { Trust } from './Trust.tsx';
import { Week } from './Week.tsx';
import { Zoom } from './Zoom.tsx';

export default function Home() {
  return (
    <main>
      <header style={{ display: 'grid', gap: 6 }}>
        <h1>Jev Lead Router · 30X</h1>
        <p className="muted">Cada lead de 30X recibe una decisión calibrada en milisegundos, no una suma fija de puntos. Los casos dudosos siempre pasan a una persona.</p>
        <p className="faint">Demo con datos 100 % sintéticos. Las respuestas de Jev son grabaciones de llamadas reales.</p>
      </header>
      <Week />
      <Zoom />
      <Trust />
    </main>
  );
}
