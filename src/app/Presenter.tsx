'use client';
// Modo presentación (docs/historial/ui-plan.md): ↑/↓ o PageUp/PageDown saltan de sección, puntos laterales de progreso
// y botón de tema claro/oscuro. No captura teclas mientras se escribe en un campo.
import { useEffect, useState } from 'react';

export function Presenter() {
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [current, setCurrent] = useState(0);
  const [light, setLight] = useState(false);

  useEffect(() => {
    const list = [...document.querySelectorAll<HTMLElement>('main > section, main section.block')].filter((s, i, a) => a.indexOf(s) === i && s.closest('section') === s);
    setSections(list);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setCurrent(list.indexOf(e.target as HTMLElement));
    }, { rootMargin: '-45% 0px -50% 0px' });
    list.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      const next = e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 0;
      if (!next || !sections.length) return;
      e.preventDefault();
      const i = Math.min(sections.length - 1, Math.max(0, current + next));
      sections[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections, current]);

  function toggleTheme() {
    const v = !light;
    setLight(v);
    if (v) document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
  }

  return (
    <>
      <nav className="progress" aria-label="Secciones">
        {sections.map((s, i) => (
          <button key={i} className={i === current ? 'on' : ''} aria-label={`Ir a: ${s.querySelector('h1, h2')?.textContent ?? `sección ${i + 1}`}`}
            onClick={() => s.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        ))}
      </nav>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-pressed={light}
        aria-label={light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
        title={light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      >
        {light ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>
    </>
  );
}

