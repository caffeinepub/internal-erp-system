import { useState, useEffect, useCallback } from 'react';

export type HashRoute =
  | { type: 'dashboard' }
  | { type: 'estimate-editor'; mode: 'create' | 'edit'; id?: string }
  | { type: 'estimate-print'; id: string };

export function useHashRoute() {
  const [route, setRoute] = useState<HashRoute>(parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newRoute: HashRoute) => {
    const hash = serializeRoute(newRoute);
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}

function parseHash(hash: string): HashRoute {
  const clean = hash.replace(/^#/, '');
  
  if (!clean || clean === 'dashboard') {
    return { type: 'dashboard' };
  }

  if (clean === 'estimate-editor-create') {
    return { type: 'estimate-editor', mode: 'create' };
  }

  const editMatch = clean.match(/^estimate-editor-edit-(.+)$/);
  if (editMatch) {
    return { type: 'estimate-editor', mode: 'edit', id: editMatch[1] };
  }

  const printMatch = clean.match(/^estimate-print-(.+)$/);
  if (printMatch) {
    return { type: 'estimate-print', id: printMatch[1] };
  }

  return { type: 'dashboard' };
}

function serializeRoute(route: HashRoute): string {
  switch (route.type) {
    case 'dashboard':
      return 'dashboard';
    case 'estimate-editor':
      if (route.mode === 'create') {
        return 'estimate-editor-create';
      } else {
        return `estimate-editor-edit-${route.id}`;
      }
    case 'estimate-print':
      return `estimate-print-${route.id}`;
  }
}
