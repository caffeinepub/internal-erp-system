import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FocusedOverlayContextType {
  isActive: boolean;
  register: () => void;
  unregister: () => void;
}

const FocusedOverlayContext = createContext<FocusedOverlayContextType | null>(null);

export function FocusedOverlayProvider({ children }: { children: ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  const isActive = activeCount > 0;

  useEffect(() => {
    if (isActive) {
      // Lock body scroll and preserve scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        const scrollPosition = parseInt(scrollY || '0') * -1;
        window.scrollTo(0, scrollPosition);
      }
    }
  }, [isActive]);

  const register = () => setActiveCount((c) => c + 1);
  const unregister = () => setActiveCount((c) => Math.max(0, c - 1));

  return (
    <FocusedOverlayContext.Provider value={{ isActive, register, unregister }}>
      {children}
    </FocusedOverlayContext.Provider>
  );
}

export function useFocusedOverlay() {
  const context = useContext(FocusedOverlayContext);
  if (!context) {
    throw new Error('useFocusedOverlay must be used within FocusedOverlayProvider');
  }
  return context;
}
