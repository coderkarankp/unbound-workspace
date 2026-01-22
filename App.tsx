
import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { ToolCard } from './components/ToolCard';
import { ToolPage } from './components/ToolPage';
import { AllCapabilities } from './components/AllCapabilities';
import { TOOLS } from './constants';
import { Sparkles, ArrowRight, CheckCircle2, Shield, Fingerprint, MousePointer2, ShieldCheck, Cpu, Lock, Zap } from 'lucide-react';

const AboutUsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 page-flow-in">
    <h1 className="text-6xl font-black text-theme-text mb-10 tracking-tight">About <span className="text-theme-primary">Unbound</span></h1>
    <div className="space-y-10 text-xl text-theme-muted leading-relaxed font-medium">
      <p>
        Unbound Workspace was built on a simple premise: professional document tools shouldn't come at the cost of your privacy.
      </p>
      <p>
        Most online PDF editors require you to upload files to their servers, where they might stay for hours or even days. We took a different approach. Our platform is designed as a "processing node" — a stateless environment where your files are handled in real-time and immediately purged.
      </p>
      <div className="grid md:grid-cols-3 gap-10 pt-10">
        <motion.div whileHover={{y:-10}} className="p-10 bg-theme-surface rounded-[2.5rem] border border-theme-border shadow-xl">
          <Zap className="w-10 h-10 text-theme-primary mb-5" />
          <h3 className="font-black text-theme-text mb-3 text-2xl">Instant</h3>
          <p className="text-sm">Real-time processing without queues.</p>
        </motion.div>
        <motion.div whileHover={{y:-10}} className="p-10 bg-theme-surface rounded-[2.5rem] border border-theme-border shadow-xl">
          <ShieldCheck className="w-10 h-10 text-theme-primary mb-5" />
          <h3 className="font-black text-theme-text mb-3 text-2xl">Private</h3>
          <p className="text-sm">Zero storage architecture by design.</p>
        </motion.div>
        <motion.div whileHover={{y:-10}} className="p-10 bg-theme-surface rounded-[2.5rem] border border-theme-border shadow-xl">
          <Cpu className="w-10 h-10 text-theme-primary mb-5" />
          <h3 className="font-black text-theme-text mb-3 text-2xl">Smart</h3>
          <p className="text-sm">AI-powered tools for modern workflows.</p>
        </motion.div>
      </div>
    </div>
  </div>
);

const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 page-flow-in">
    <h1 className="text-6xl font-black text-theme-text mb-10 tracking-tight">Privacy <span className="text-theme-primary">Protocol</span></h1>
    <div className="space-y-10 text-xl text-theme-muted leading-relaxed font-medium">
      <div className="p-12 bg-theme-primarySoft border border-theme-primary/20 rounded-[3.5rem] shadow-inner">
        <h2 className="text-3xl font-black text-theme-primary mb-6">Our Core Commitment</h2>
        <p className="text-theme-text text-xl leading-relaxed">
          We do not store any data. Your documents exist on our platform only for the precise duration of the processing cycle.
        </p>
      </div>
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-theme-text">Stateless Processing</h3>
        <p>
          Unbound Workspace operates on a stateless architecture. This means that as soon as your conversion is complete and you download the file, the data is wiped from our active memory.
        </p>
      </section>
      <section className="space-y-6">
        <h3 className="text-2xl font-black text-theme-text">No Accounts, No Tracking</h3>
        <p>
          We don't require accounts. By removing the login requirement, we ensure that your document processing history is never tied to a personal identity.
        </p>
      </section>
    </div>
  </div>
);

const HomePage: React.FC = () => {
  return (
    <div className="bg-theme-bg min-h-screen transition-soft overflow-hidden">
      <section className="relative pt-40 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-3 bg-theme-accent/10 text-theme-accent px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-[0.25em] mb-12 shadow-sm"
          >
            <ShieldCheck className="w-5 h-5" />
            Zero Storage Protocol
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black text-theme-text mb-10 tracking-tight leading-[0.85]"
          >
            Privacy First.<br />
            <span className="text-theme-primary inline-block relative">
              Unbound
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-2 left-0 h-3 bg-theme-primary/20 -z-10" 
              />
            </span> Documents.
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-theme-muted max-w-2xl mx-auto mb-16 font-medium leading-relaxed"
          >
            Professional document tools that respect your privacy. No accounts, no logs, and no storage. Your files stay yours.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-8"
          >
            <Link to="/capabilities" className="group bg-theme-primary text-theme-bg px-14 py-6 rounded-3xl font-black text-xl hover:scale-105 transition-all shadow-2xl active:opacity-90 noir-glow-teal relative overflow-hidden">
              <span className="relative z-10">Explore All Tools</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.6 }}
            className="mt-32 flex flex-wrap justify-center gap-16"
          >
            <div className="flex items-center gap-3 font-black text-[12px] uppercase tracking-widest text-theme-text"><Shield className="w-6 h-6 text-theme-primary" /> NO STORAGE</div>
            <div className="flex items-center gap-3 font-black text-[12px] uppercase tracking-widest text-theme-text"><Fingerprint className="w-6 h-6 text-theme-primary" /> FAST SYNC</div>
            <div className="flex items-center gap-3 font-black text-[12px] uppercase tracking-widest text-theme-text"><MousePointer2 className="w-6 h-6 text-theme-primary" /> NO AUTH</div>
          </motion.div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-[35%] h-[35%] bg-theme-primary/10 blur-[150px] rounded-full animate-pulse-gentle" />
          <div className="absolute bottom-[20%] right-[10%] w-[45%] h-[45%] bg-theme-accent/5 blur-[180px] rounded-full animate-pulse-gentle" style={{ animationDelay: '3s' }} />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
             <div className="absolute top-0 left-[20%] w-px h-full bg-theme-text" />
             <div className="absolute top-0 left-[40%] w-px h-full bg-theme-text" />
             <div className="absolute top-0 left-[60%] w-px h-full bg-theme-text" />
             <div className="absolute top-0 left-[80%] w-px h-full bg-theme-text" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
          <div className="max-w-xl">
            <h2 className="text-5xl font-black text-theme-text mb-6 tracking-tight">The Arsenal</h2>
            <p className="text-xl text-theme-muted font-medium leading-relaxed">Fast and secure tools for all your document needs.</p>
          </div>
          <Link to="/capabilities" className="flex items-center gap-3 text-theme-primary font-black text-[13px] uppercase tracking-widest hover:translate-x-2 transition-all group">
            All Capabilities <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {TOOLS.slice(0, 8).map((tool, idx) => (
            <motion.div 
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <ToolCard tool={tool} />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-6 lg:mx-12 mb-40">
        <div className="max-w-7xl mx-auto bg-theme-elevated rounded-[4rem] overflow-hidden shadow-2xl relative group">
          <div className="grid md:grid-cols-2 gap-0 relative z-10">
            <div className="p-16 lg:p-28 flex flex-col justify-center">
              <div className="bg-theme-primarySoft text-theme-primary px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.25em] mb-10 w-fit">
                Smart & Secure
              </div>
              <h2 className="text-5xl lg:text-6xl font-black text-theme-text mb-10 tracking-tight leading-tight">Instant sync.<br />Permanent privacy.</h2>
              <p className="text-theme-muted text-xl mb-12 leading-relaxed font-medium">
                Our processing is completely private. Files are handled in temporary memory and are deleted immediately after you download your results.
              </p>
              <div className="space-y-8">
                {["No Data Stored", "Secure Processing", "Auto-Delete on Close", "Private Connection"].map((item, i) => (
                  <div key={i} className="flex items-center gap-5 text-theme-text font-bold text-lg">
                    <div className="bg-theme-primary p-2 rounded-xl shadow-lg noir-glow-teal">
                      <CheckCircle2 className="w-5 h-5 text-theme-bg" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[600px] overflow-hidden opacity-40">
              <img src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=1000" alt="Security" className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-overlay group-hover:scale-110 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-theme-elevated" />
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
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tool/:id" element={<ToolPage />} />
          <Route path="/capabilities" element={<AllCapabilities />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => (
  <Layout>
    <AnimatedRoutes />
  </Layout>
);

export default App;
