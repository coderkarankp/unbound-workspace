
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Layers, Heart, Menu, X, Zap, ChevronDown, 
  FileText, Files, Scissors, RotateCw, Lock, ScanText, 
  FileUp, FileImage, Languages, LayoutGrid, Shield,
  Monitor, BrainCircuit, Repeat, Unlock, ShieldAlert, PenTool,
  Sun, Moon, ShieldCheck, Cpu
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<'convert' | 'all' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const DropdownItem = ({ to, label, icon: Icon }: { to: string, label: string, icon: any }) => (
    <Link 
      to={to} 
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-noir-bg dark:hover:bg-noir-surface-elevated transition-soft group/item"
    >
      <div className="text-noir-text-muted dark:text-noir-text-darkMuted group-hover/item:text-at-teal dark:group-hover/item:text-at-teal-dark group-hover/item:translate-x-0.5 transition-soft">
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <span className="text-[13.5px] font-bold text-noir-text dark:text-noir-text-dark leading-tight">{label}</span>
    </Link>
  );

  const NavButton = ({ label, to, onClick, isActive, hasChevron }: { label: string, to?: string, onClick?: (e: React.MouseEvent) => void, isActive?: boolean, hasChevron?: boolean }) => {
    const content = (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-black uppercase tracking-wider transition-soft group ${
          isActive ? 'text-at-teal dark:text-at-teal-dark' : 'text-noir-text dark:text-noir-text-dark hover:text-at-teal dark:hover:text-at-teal-dark'
        }`}
      >
        {label}
        {hasChevron && <ChevronDown className={`w-3.5 h-3.5 transition-soft ${isActive ? 'rotate-180' : ''}`} />}
        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-at-teal dark:bg-at-teal-dark transition-soft ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </button>
    );
    return to ? <Link to={to}>{content}</Link> : content;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-at-teal selection:text-white dark:bg-noir-bg-dark">
      <header 
        ref={menuRef}
        className={`fixed top-0 left-0 right-0 z-[100] bg-noir-bg dark:bg-noir-bg-dark transition-soft ${
          scrolled ? 'shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:border-b dark:border-noir-surface-elevated py-2' : 'py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0 active:opacity-80 transition-soft">
              <div className="bg-noir-text dark:bg-at-teal-dark p-2 rounded-xl group-hover:rotate-3 transition-soft noir-glow-teal">
                <Layers className="text-white dark:text-noir-bg-dark w-5 h-5" />
              </div>
              <span className="text-xl font-black text-noir-text dark:text-noir-text-dark tracking-tight">Unbound</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-4">
              <NavButton label="MERGE" to="/tool/merge-pdf" />
              <NavButton label="SPLIT" to="/tool/split-pdf" />
              <NavButton label="COMPRESS" to="/tool/compress-pdf" />
              <div className="relative">
                <NavButton 
                  label="CONVERT" 
                  hasChevron 
                  isActive={activeMenu === 'convert'} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === 'convert' ? null : 'convert');
                  }} 
                />
                {activeMenu === 'convert' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[520px] bg-noir-surface dark:bg-noir-surface-dark border border-noir-bg dark:border-noir-surface-elevated shadow-xl rounded-[14px] p-6 grid grid-cols-2 gap-8 animate-[dropdown-fade_300ms_ease-out] z-[110]">
                    <div>
                      <div className="text-[10px] font-black text-at-teal dark:text-at-teal-dark uppercase tracking-[0.2em] mb-4 pl-4">Into PDF</div>
                      <div className="space-y-0.5">
                        <DropdownItem to="/tool/word-to-pdf" label="Word to PDF" icon={FileUp} />
                        <DropdownItem to="/tool/excel-to-pdf" label="Excel to PDF" icon={LayoutGrid} />
                        <DropdownItem to="/tool/ppt-to-pdf" label="PPT to PDF" icon={Monitor} />
                        <DropdownItem to="/tool/jpg-to-pdf" label="Image to PDF" icon={FileImage} />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-at-teal dark:text-at-teal-dark uppercase tracking-[0.2em] mb-4 pl-4">From PDF</div>
                      <div className="space-y-0.5">
                        <DropdownItem to="/tool/pdf-to-word" label="PDF to Word" icon={FileText} />
                        <DropdownItem to="/tool/pdf-to-jpg" label="PDF to Image" icon={FileImage} />
                        <DropdownItem to="/tool/pdf-to-excel" label="PDF to Excel" icon={LayoutGrid} />
                        <DropdownItem to="/tool/pdf-to-ppt" label="PDF to PPT" icon={Monitor} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <NavButton label="ALL TOOLS" to="/capabilities" />
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-at-teal/5 dark:bg-at-teal-dark/10 rounded-full border border-at-teal/10 dark:border-at-teal-dark/20">
                <ShieldCheck className="w-3.5 h-3.5 text-at-teal dark:text-at-teal-dark" />
                <span className="text-[9px] font-black uppercase tracking-widest text-at-teal dark:text-at-teal-dark">Stateless Workspace</span>
              </div>
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-noir-text dark:text-noir-text-dark hover:bg-noir-bg dark:hover:bg-noir-surface-elevated transition-soft group active:opacity-70"
                title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5 group-hover:-rotate-6 transition-soft" /> : <Sun className="w-5 h-5 group-hover:rotate-12 transition-soft" />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-noir-text dark:text-noir-text-dark p-2 rounded-xl transition-soft">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[74px]" />
      <main className="flex-grow">{children}</main>
      <footer className="bg-noir-surface dark:bg-noir-surface-dark border-t border-noir-bg dark:border-noir-surface-elevated pt-20 pb-12 transition-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-20">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-8">
                <div className="bg-at-teal dark:bg-at-teal-dark p-1.5 rounded-lg noir-glow-teal"><Layers className="text-white dark:text-noir-bg-dark w-5 h-5" /></div>
                <span className="text-2xl font-black text-noir-text dark:text-noir-text-dark">Unbound</span>
              </Link>
              <p className="text-noir-text-muted dark:text-noir-text-darkMuted text-[14px] leading-relaxed max-w-xs mb-10 font-medium">
                The intelligent, stateless workspace for document flow. Files are processed in volatile memory and never stored.
              </p>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 px-4 py-2 bg-noir-bg dark:bg-noir-surface-elevated rounded-xl border border-noir-bg dark:border-noir-surface-elevated">
                    <Cpu className="w-4 h-4 text-at-amber dark:text-at-amber-dark" />
                    <span className="text-[10px] font-black uppercase tracking-widest dark:text-noir-text-dark">Database-Free</span>
                 </div>
              </div>
            </div>
            {['Flows', 'Privacy', 'Legal'].map((section, idx) => (
              <div key={idx}>
                <h4 className="font-black text-[11px] uppercase tracking-widest text-noir-text dark:text-noir-text-dark mb-8">{section}</h4>
                <ul className="space-y-4 text-[13px] text-noir-text-muted dark:text-noir-text-darkMuted font-semibold">
                  <li><Link to="/capabilities" className="hover:text-at-teal dark:hover:text-at-teal-dark transition-soft">All Tools</Link></li>
                  <li><a href="#" className="hover:text-at-teal dark:hover:text-at-teal-dark transition-soft">Zero-Log Policy</a></li>
                  <li><a href="#" className="hover:text-at-teal dark:hover:text-at-teal-dark transition-soft">Volatile Memory</a></li>
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-noir-bg dark:border-noir-surface-elevated flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-noir-text-muted/40 dark:text-noir-text-darkDim uppercase tracking-[0.2em]">
              Stateless Architecture by Unbound Tech
            </div>
            <div className="text-noir-text-muted/30 dark:text-noir-text-darkDim text-[10px] font-bold uppercase tracking-wider">
              © 2025 Unbound Workspace. Private & Stateless.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};