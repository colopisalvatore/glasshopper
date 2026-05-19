import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { CodeWindow } from './components/CodeWindow';
import { Install } from './components/Install';
import { Templates } from './components/Templates';
import { Footer } from './components/Footer';

export function App() {
  return (
    <main className="page">
      <Nav />
      <Hero />
      <CodeWindow />
      <Features />
      <Templates />
      <Install />
      <Footer />
    </main>
  );
}
