import { Link } from 'react-router-dom';
import ulboLogo from '@/assets/ulbo-logo.png';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={ulboLogo} alt="ULBO Logo" className="h-8 w-8 object-contain" />
            <span className="font-serif text-lg font-bold">ULBO-RCU-DRV</span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/references" className="transition-colors hover:text-foreground">
              Explorer
            </Link>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Connexion
            </Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © 2026 ULBO-RCU-DRV. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
