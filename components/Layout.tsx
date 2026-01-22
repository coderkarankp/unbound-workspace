
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Menu, X, ChevronDown, 
  FileImage, Sun, Moon, ShieldCheck, Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<'convert' | 'all' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { mode, toggleTheme } = useTheme();
  
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

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

  const DropdownItem = ({ to, label, icon: Icon }: { to: string, label: string, icon: any }) => (
    <Link 
      to={to} 
      className="flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-theme-primarySoft transition-all group/item anime-card-hover"
    >
      <div className="text-theme-muted group-hover/item:text-theme-primary group-hover/item:scale-110 transition-all">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <span className="text-[14px] font-black text-theme-text leading-tight">{label}</span>
    </Link>
  );

  const NavButton = ({ label, to, onClick, isActive, hasChevron }: { label: string, to?: string, onClick?: (e: React.MouseEvent) => void, isActive?: boolean, hasChevron?: boolean }) => {
    const content = (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-2 px-4 py-2.5 text-[12px] font-black uppercase tracking-[0.2em] transition-all group ${
          isActive ? 'text-theme-primary' : 'text-theme-text hover:text-theme-primary'
        }`}
      >
        {label}
        {hasChevron && <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'rotate-180' : ''}`} />}
        <motion.span 
          initial={false}
          animate={{ width: isActive ? '100%' : '0%' }}
          className="absolute bottom-0 left-0 h-[3px] bg-theme-primary rounded-full" 
        />
        {!isActive && <span className="absolute bottom-0 left-0 h-[3px] bg-theme-primary/20 w-0 group-hover:w-full transition-all rounded-full" />}
      </button>
    );
    return to ? <Link to={to}>{content}</Link> : content;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-theme-primary selection:text-white bg-theme-bg font-sans">
      <header 
        ref={menuRef}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled 
          ? 'bg-theme-bg/90 backdrop-blur-xl border-b border-theme-border py-3' 
          : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group shrink-0 active:scale-95 transition-all">
              <div className="bg-theme-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-all noir-glow-teal">
                <Layers className="text-theme-bg dark:text-theme-bg w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-theme-text tracking-tighter">Unbound</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
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
                <AnimatePresence>
                  {activeMenu === 'convert' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-[320px] glass-panel border border-theme-border shadow-xl rounded-[2.5rem] p-8 z-[110]"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-black text-theme-primary uppercase tracking-[0.3em] mb-4 pl-5">Image Processing</div>
                        <DropdownItem to="/tool/jpg-to-pdf" label="Image to PDF" icon={FileImage} />
                        <DropdownItem to="/tool/pdf-to-jpg" label="PDF to Image" icon={FileImage} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <NavButton label="ALL TOOLS" to="/capabilities" />
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-theme-primarySoft rounded-full border border-theme-primary/10">
                <ShieldCheck className="w-4 h-4 text-theme-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-primary">Secure Sync</span>
              </div>
              <button 
                onClick={toggleTheme}
                className="p-3 rounded-2xl text-theme-text hover:bg-theme-primarySoft transition-all group active:scale-90"
              >
                {mode === 'light' ? <Moon className="w-6 h-6 group-hover:-rotate-12 transition-all" /> : <Sun className="w-6 h-6 group-hover:rotate-12 transition-all" />}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-theme-text p-2.5 rounded-2xl transition-all">
                {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[90px]" />
      <main className="flex-grow">{children}</main>
      <footer className="bg-theme-surface border-t border-theme-border pt-28 pb-16 transition-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-20 mb-24">
            <div className="max-w-md">
              <Link to="/" className="flex items-center gap-4 mb-10">
                <div className="bg-theme-primary p-2 rounded-xl noir-glow-teal"><Layers className="text-theme-bg w-6 h-6" /></div>
                <span className="text-3xl font-black text-theme-text tracking-tighter">Unbound</span>
              </Link>
              <p className="text-theme-muted text-[16px] leading-relaxed mb-12 font-medium">
                Simple, secure document tools. Your files are processed instantly and never saved.
              </p>
              <div className="flex gap-4">
                 <div className="flex items-center gap-3 px-6 py-3 bg-theme-bg rounded-2xl border border-theme-border transition-all hover:scale-105">
                    <Cpu className="w-5 h-5 text-theme-accent" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-text">Privacy Guarded</span>
                 </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 min-w-[240px]">
              <ul className="space-y-5 text-[15px] text-theme-muted font-black tracking-widest uppercase pt-4">
                <li><Link to="/capabilities" className="hover:text-theme-primary transition-all">All Capabilities</Link></li>
                <li><Link to="/about" className="hover:text-theme-primary transition-all">Origins</Link></li>
                <li><Link to="/privacy" className="hover:text-theme-primary transition-all">Privacy Protocol</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-theme-border flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3 text-[12px] font-black text-theme-muted/40 uppercase tracking-[0.3em]">
              Safe Processing • Zero Storage
            </div>
            <div className="text-theme-muted/30 text-[11px] font-black uppercase tracking-widest">
              © 2025 Unbound • Infinite Flow
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
