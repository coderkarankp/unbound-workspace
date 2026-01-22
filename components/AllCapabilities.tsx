
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TOOLS } from '../constants';
import { ToolCard } from './ToolCard';
import { 
  ChevronLeft, ChevronRight, Search, LayoutGrid, 
  Repeat, Zap, Shield, SlidersHorizontal 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AllCapabilities: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const itemsPerPage = 12;

  const categories = [
    { id: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'convert', label: 'Convert', icon: <Repeat className="w-4 h-4" /> },
    { id: 'optimize', label: 'Optimize', icon: <Zap className="w-4 h-4" /> },
    { id: 'edit', label: 'Edit', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const currentTools = filteredTools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const updateParams = (newParams: Record<string, string | null>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === 'all' || (key === 'page' && value === '1') || (key === 'q' && value === '')) {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
    });
    setSearchParams(updated);
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-theme-bg min-h-screen py-20 transition-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up-soft">
          <h1 className="text-5xl font-black text-theme-text mb-6 tracking-tighter">
            Full <span className="text-theme-primary">Capability</span> Suite
          </h1>
          <p className="text-lg text-theme-muted font-medium max-w-2xl mx-auto">
            Discover the specialized tools driving the next generation of intelligent document management.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12 animate-fade-in-up-soft delay-100">
          <div className="flex-grow relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-dim group-focus-within:text-theme-primary transition-soft" />
            <input 
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => { 
                updateParams({ q: e.target.value, page: '1' });
              }}
              className="w-full bg-theme-surface border border-theme-border rounded-2xl py-4 pl-14 pr-6 text-theme-text font-bold text-sm focus:border-theme-primary/40 outline-none transition-soft shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { 
                  updateParams({ category: cat.id, page: '1' });
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-soft ${
                  selectedCategory === cat.id 
                  ? 'bg-theme-primary text-theme-bg shadow-md noir-glow-teal' 
                  : 'bg-theme-surface text-theme-muted border border-theme-border hover:brightness-105'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {currentTools.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {currentTools.map((tool, idx) => (
                <motion.div 
                  key={tool.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ToolCard tool={tool} />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-4 rounded-xl bg-theme-surface text-theme-text disabled:opacity-30 transition-soft border border-theme-border"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-12 h-12 rounded-xl text-sm font-black transition-soft ${
                        currentPage === i + 1 
                        ? 'bg-theme-primary text-theme-bg shadow-lg noir-glow-teal' 
                        : 'bg-theme-surface text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-4 rounded-xl bg-theme-surface text-theme-text disabled:opacity-30 transition-soft border border-theme-border"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-theme-surface rounded-[3rem] border-2 border-dashed border-theme-border animate-fade-in-up-soft">
            <div className="p-8 rounded-full bg-theme-bg text-theme-primary inline-block mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-theme-text mb-2">No tools match your search</h3>
            <p className="text-theme-dim font-medium text-sm">Try broadening your search or switching categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};
