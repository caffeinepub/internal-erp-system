import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-3 py-2 max-w-7xl">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            © 2026. Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p className="font-mono font-semibold text-primary">Version 36</p>
        </div>
      </div>
    </footer>
  );
}
