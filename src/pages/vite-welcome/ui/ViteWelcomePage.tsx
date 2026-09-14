import { useState } from 'react';
import { Link } from '@/shared/lib/router';
import heroImg from './assets/hero.png';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import './ViteWelcomePage.css';

export const ViteWelcomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/pages/vite-welcome/ui/ViteWelcomePage.tsx</code> and save to test{' '}
            <code>HMR</code>
          </p>
        </div>
        <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>

        {/* Game Versions Playground Links */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md p-5 rounded-2xl bg-amber-50/80 dark:bg-zinc-800/70 border border-amber-200/80 dark:border-zinc-700 shadow-sm text-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h2 className="text-lg font-bold text-amber-950 dark:text-zinc-100 m-0">
              Neko Neko Juju
            </h2>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-zinc-400 m-0">
            Select game layout and component combinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full">
            <Link
              href="/game"
              className="flex-1 min-w-[140px] text-center px-4 py-2.5 rounded-xl font-bold text-sm bg-neko-primary text-white shadow-sm hover:opacity-90 transition cursor-pointer"
            >
              Play Latest (/game)
            </Link>
            <Link
              href="/game-v0.3.z"
              className="flex-1 min-w-[140px] text-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-zinc-900 border border-amber-900/20 dark:border-zinc-700 text-amber-950 dark:text-zinc-200 hover:bg-amber-100/50 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              v0.3.z (/game-v0.3.z)
            </Link>
            <div className="flex w-full items-center justify-center gap-2">
              <Link
                href="/game-v0.2.z"
                className="flex-1 text-center px-3 py-1.5 rounded-lg font-medium text-xs text-zinc-500 hover:text-amber-950 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-amber-100/30 dark:hover:bg-zinc-800/40 transition cursor-pointer"
              >
                ← v0.2.z (/game-v0.2.z)
              </Link>
              <Link
                href="/game-v0.1.z"
                className="flex-1 text-center px-3 py-1.5 rounded-lg font-medium text-xs text-zinc-500 hover:text-amber-950 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-amber-100/30 dark:hover:bg-zinc-800/40 transition cursor-pointer"
              >
                ← v0.1.z (/game-v0.1.z)
              </Link>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Active target: <strong>v0.3.z</strong> (Modular Widgets + Session Engine)
            </span>
          </div>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
};
