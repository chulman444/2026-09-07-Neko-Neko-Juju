import React from 'react';
import { RouterProvider, useRouter, Link } from '@/shared/lib/router';
import { GamePage as GamePageV01 } from '@/pages/game-v0.1.z';
import { GamePage as GamePageV02 } from '@/pages/game-v0.2.z';
import { GamePage as GamePageV03 } from '@/pages/game-v0.3.z';
import { ViteWelcomePage } from '@/pages/vite-welcome';

const AppRoutes: React.FC = () => {
  const { path } = useRouter();

  // Normalize path by stripping trailing slashes (except for '/')
  const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;

  switch (normalizedPath) {
    case '/':
      return <ViteWelcomePage />;

    case '/game':
    case '/game-v0.3.z':
    case '/game-v0.3':
      return <GamePageV03 />;

    case '/game-v0.2.z':
    case '/game-v0.2':
      return <GamePageV02 />;

    case '/game-v0.1.z':
    case '/game-v0.1':
    case '/game-v0':
      return <GamePageV01 />;

    default:
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-3xl font-extrabold text-amber-950 dark:text-zinc-100">
            404 - Page Not Found
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm">
            The path{' '}
            <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300">
              {path}
            </code>{' '}
            does not match any registered game route.
          </p>
          <div className="flex gap-3 mt-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              ← Home
            </Link>
            <Link
              href="/game"
              className="px-4 py-2 rounded-xl text-sm font-bold bg-neko-primary text-white hover:opacity-90 transition"
            >
              Play Game →
            </Link>
          </div>
        </div>
      );
  }
};

export const App: React.FC = () => {
  return (
    <RouterProvider>
      <main className="min-h-screen flex flex-col">
        <AppRoutes />
      </main>
    </RouterProvider>
  );
};
