'use client';
// Modo presentación (docs/ui-plan.md): ↑/↓ o PageUp/PageDown saltan de sección, puntos laterales de progreso
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
      <button className="theme-toggle" onClick={toggleTheme} aria-pressed={light}>{light ? 'Tema oscuro' : 'Tema claro'}</button>
    </>
  );
}
