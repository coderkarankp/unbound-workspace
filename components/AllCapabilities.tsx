
import React, { useState, useMemo } from 'react';
import { TOOLS } from '../constants';
import { ToolCard } from './ToolCard';
import { 
  ChevronLeft, ChevronRight, Search, LayoutGrid, 
  Repeat, Zap, Shield, BrainCircuit, SlidersHorizontal 
} from 'lucide-react';

export const AllCapabilities: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const itemsPerPage = 12;

  const categories = [
    { id: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'convert', label: 'Convert', icon: <Repeat className="w-4 h-4" /> },
    { id: 'optimize', label: 'Optimize', icon: <Zap className="w-4 h-4" /> },
    { id: 'edit', label: 'Edit', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Suite', icon: <BrainCircuit className="w-4 h-4" /> },
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-noir-bg dark:bg-noir-bg-dark min-h-screen py-20 transition-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up-soft">
          <h1 className="text-5xl font-black text-noir-text dark:text-noir-text-dark mb-6 tracking-tighter">
            Full <span className="text-at-teal dark:text-at-teal-dark">Capability</span> Suite
          </h1>
          <p className="text-lg text-noir-text-muted dark:text-noir-text-darkMuted font-medium max-w-2xl mx-auto">
            Discover the specialized tools driving the next generation of intelligent document management.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12 animate-fade-in-up-soft delay-100">
          <div className="flex-grow relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-noir-text-dim dark:text-noir-text-darkDim group-focus-within:text-at-teal transition-soft" />
            <input 
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-noir-surface dark:bg-noir-surface-dark border border-noir-bg dark:border-noir-surface-elevated rounded-2xl py-4 pl-14 pr-6 text-noir-text dark:text-noir-text-dark font-bold text-sm focus:border-at-teal/40 outline-none transition-soft shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-soft ${
                  selectedCategory === cat.id 
                  ? 'bg-at-teal dark:bg-at-teal-dark text-white dark:text-noir-bg-dark shadow-md noir-glow-teal' 
                  : 'bg-noir-surface dark:bg-noir-surface-dark text-noir-text-muted dark:text-noir-text-darkMuted border border-noir-bg dark:border-noir-surface-elevated hover:brightness-105'
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
                <div key={tool.id} className="animate-fade-in-up-soft opacity-0" style={{ animationDelay: `${idx * 40}ms` }}>
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-4 rounded-xl bg-noir-surface dark:bg-noir-surface-dark text-noir-text dark:text-noir-text-dark disabled:opacity-30 transition-soft border border-noir-bg dark:border-noir-surface-elevated"
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
                        ? 'bg-at-teal dark:bg-at-teal-dark text-white dark:text-noir-bg-dark shadow-lg noir-glow-teal' 
                        : 'bg-noir-surface dark:bg-noir-surface-dark text-noir-text-muted dark:text-noir-text-darkMuted hover:text-noir-text'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-4 rounded-xl bg-noir-surface dark:bg-noir-surface-dark text-noir-text dark:text-noir-text-dark disabled:opacity-30 transition-soft border border-noir-bg dark:border-noir-surface-elevated"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-noir-surface dark:bg-noir-surface-dark rounded-[3rem] border border-dashed border-noir-text/10 dark:border-noir-surface-elevated animate-fade-in-up-soft">
            <div className="p-8 rounded-full bg-noir-bg dark:bg-noir-surface-elevated text-at-teal inline-block mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-noir-text dark:text-noir-text-dark mb-2">No tools match your search</h3>
            <p className="text-noir-text-dim dark:text-noir-text-darkDim font-medium text-sm">Try broadening your search or switching categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};