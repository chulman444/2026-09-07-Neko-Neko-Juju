import { createContext, useContext } from 'react';

export interface RouterContextType {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

export const RouterContext = createContext<RouterContextType | null>(null);

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    return {
      path: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
      navigate: (to: string, options?: { replace?: boolean }) => {
        if (typeof window !== 'undefined') {
          if (options?.replace) {
            window.history.replaceState({}, '', to);
          } else {
            window.history.pushState({}, '', to);
          }
        }
      },
    };
  }
  return context;
};
