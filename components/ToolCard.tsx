
import React from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';
import { ChevronRight } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <Link 
      to={`/tool/${tool.id}`}
      className="group bg-theme-surface p-8 rounded-[2rem] border border-theme-border shadow-sm hover:shadow-xl dark:hover:noir-glow-teal transition-soft flex flex-col items-center text-center relative overflow-hidden"
    >
      <div className={`mb-6 p-5 rounded-2xl ${tool.color} text-theme-text dark:text-theme-primary shadow-lg group-hover:brightness-110 transition-soft`}>
        {React.cloneElement(tool.icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
      </div>
      <h3 className="text-xl font-bold text-theme-text mb-3 leading-tight tracking-tight">{tool.name}</h3>
      <p className="text-sm text-theme-muted font-medium leading-relaxed mb-6 line-clamp-2">{tool.description}</p>
      
      <div className="mt-auto flex items-center gap-1.5 text-theme-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-soft group-hover:translate-x-1">
        Open Tool <ChevronRight className="w-3 h-3" />
      </div>

      <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-soft ${tool.color}`} />
    </Link>
  );
};
