
import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToolCard } from './components/ToolCard';
import { ToolPage } from './components/ToolPage';
import { AllCapabilities } from './components/AllCapabilities';
import { TOOLS } from './constants';
import { Sparkles, ArrowRight, CheckCircle2, Shield, Fingerprint, MousePointer2, ShieldCheck } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="bg-noir-bg dark:bg-noir-bg-dark min-h-screen transition-soft">
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-at-amber/10 dark:bg-at-amber-dark/20 text-at-amber dark:text-at-amber-dark px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-fade-in-up-soft">
            <ShieldCheck className="w-4 h-4" />
            Zero-Storage Workspace
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-noir-text dark:text-noir-text-dark mb-8 tracking-tighter leading-[0.9] animate-fade-in-up-soft delay-100 opacity-0">
            Privacy First.<br />
            <span className="text-at-teal dark:text-at-teal-dark inline-block">Unbound</span> Documents.
          </h1>
          <p className="text-xl text-noir-text-muted dark:text-noir-text-darkMuted max-w-2xl mx-auto mb-14 font-medium leading-relaxed animate-fade-in-up-soft delay-200 opacity-0">
            Professional document tools with absolute statelessness. No accounts, no logs, no databases. Your files never leave your sight.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 animate-fade-in-up-soft delay-300 opacity-0">
            <a href="#tools" className="bg-at-teal dark:bg-at-teal-dark text-white dark:text-noir-bg-dark px-10 py-5 rounded-2xl font-bold text-lg hover:brightness-110 transition-soft shadow-lg active:opacity-90 noir-glow-teal">
              Launch Workspace
            </a>
            <Link to="/capabilities" className="bg-noir-surface/50 dark:bg-noir-surface-dark backdrop-blur-sm text-noir-text dark:text-noir-text-dark border border-noir-text/10 dark:border-noir-surface-elevated px-10 py-5 rounded-2xl font-bold text-lg hover:bg-noir-surface transition-soft shadow-sm">
              All 50+ Tools
            </Link>
          </div>
          <div className="mt-24 flex flex-wrap justify-center gap-12 opacity-30 dark:opacity-20 animate-fade-in-up-soft delay-500 opacity-0">
            <div className="flex items-center gap-2 font-bold text-noir-text dark:text-noir-text-dark"><Shield className="w-5 h-5" /> NO DATABASE</div>
            <div className="flex items-center gap-2 font-bold text-noir-text dark:text-noir-text-dark"><Fingerprint className="w-5 h-5" /> VOLATILE PROCESSING</div>
            <div className="flex items-center gap-2 font-bold text-noir-text dark:text-noir-text-dark"><MousePointer2 className="w-5 h-5" /> NO ACCOUNTS</div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-at-teal/10 dark:bg-at-teal-dark/5 blur-[120px] rounded-full animate-pulse-gentle" />
          <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-at-amber/5 dark:bg-at-amber-dark/5 blur-[140px] rounded-full animate-pulse-gentle" style={{ animationDelay: '3s' }} />
        </div>
      </section>

      <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 animate-fade-in-up-soft">
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold text-noir-text dark:text-noir-text-dark mb-4 tracking-tight">The Toolkit</h2>
            <p className="text-lg text-noir-text-muted dark:text-noir-text-darkMuted font-medium leading-relaxed">Stateless processing nodes for all your document needs.</p>
          </div>
          <Link to="/capabilities" className="flex items-center gap-2 text-at-teal dark:text-at-teal-dark font-black text-[11px] uppercase tracking-widest hover:translate-x-1 transition-soft group">
            Explore All Tools <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TOOLS.slice(0, 8).map((tool, idx) => (
            <div key={tool.id} className="animate-fade-in-up-soft opacity-0" style={{ animationDelay: `${idx * 40 + 400}ms` }}>
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-4 lg:mx-8 mb-32">
        <div className="max-w-7xl mx-auto bg-noir-text dark:bg-noir-surface-elevated rounded-[3rem] overflow-hidden shadow-2xl relative group">
          <div className="grid md:grid-cols-2 gap-0 relative z-10">
            <div className="p-16 lg:p-24 flex flex-col justify-center">
              <div className="bg-at-teal/20 text-at-teal-dark dark:text-at-teal-dark px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 w-fit">
                Stateless Intelligence
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-noir-text-dark mb-8 tracking-tight leading-tight">Ephemeral documents.<br />Permanent privacy.</h2>
              <p className="text-noir-bg/60 dark:text-noir-text-darkMuted text-lg mb-10 leading-relaxed font-medium">
                Our AI processing is completely volatile. Files are uploaded into RAM, processed by our LLM nodes, and the connection is closed instantly after your download.
              </p>
              <div className="space-y-6">
                {["No Storage Backend", "RAM-Only Processing", "Instant Node Wipe", "Encrypted Tunneling"].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-white/90 dark:text-noir-text-dark font-semibold transition-soft">
                    <div className="bg-at-teal dark:bg-at-teal-dark p-1.5 rounded-lg shadow-lg noir-glow-teal">
                      <CheckCircle2 className="w-4 h-4 text-white dark:text-noir-bg-dark" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[500px] overflow-hidden opacity-30">
              <img src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=1000" alt="Data Security" className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-overlay group-hover:scale-105 transition-soft duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-noir-text dark:to-noir-surface-elevated" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-flow-in">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tool/:id" element={<ToolPage />} />
        <Route path="/capabilities" element={<AllCapabilities />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => (
  <Layout>
    <AnimatedRoutes />
  </Layout>
);

export default App;