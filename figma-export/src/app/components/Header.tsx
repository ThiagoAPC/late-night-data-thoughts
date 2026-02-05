import { Moon, Sun, Github } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentPage: 'home' | 'about';
  onNavigate: (page: 'home' | 'about') => void;
}

export function Header({ darkMode, toggleDarkMode, currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="border-b py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('home')}
            className="text-xl font-semibold hover:opacity-70 transition-opacity"
          >
            tech.blog
          </button>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('about')}
              className={`text-sm hover:opacity-70 transition-opacity ${
                currentPage === 'about' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              About
            </button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-70 transition-opacity"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          
          <button 
            onClick={toggleDarkMode}
            className="hover:opacity-70 transition-opacity"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}