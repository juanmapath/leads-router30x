import { Adopt } from './Adopt.tsx';
import { Demo } from './Demo.tsx';
import { Presenter } from './Presenter.tsx';
import { Trust } from './Trust.tsx';

export default function Home() {
  return (
    <main>
      <Demo />
      <Trust />
      <Adopt />
      <Presenter />
    </main>
  );
}
