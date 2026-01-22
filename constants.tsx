
import React from 'react';
import { 
  Files, Scissors, Zap, FileImage, Lock, RotateCw, 
  Unlock, PenTool, Minimize2, Wrench, Type, Trash2, 
  Layers, Shapes, Grid, Settings, Eye, Clock
} from 'lucide-react';
import { Tool } from './types';

export const TOOLS: Tool[] = [
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one single document instantly.',
    icon: <Files className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Separate one page or a whole set for easy management.',
    icon: <Scissors className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal quality.',
    icon: <Zap className="w-8 h-8" />,
    category: 'optimize',
    color: 'bg-theme-secondarySoft'
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Protect PDF files with a password and secure encryption.',
    icon: <Lock className="w-8 h-8" />,
    category: 'security',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate your PDFs the way you need them. Supports batch mode.',
    icon: <RotateCw className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert each PDF page to a high-quality JPG image.',
    icon: <FileImage className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'jpg-to-pdf',
    name: 'Image to PDF',
    description: 'Convert JPG and PNG images into a professional PDF.',
    icon: <FileImage className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'flatten-pdf',
    name: 'Flatten PDF',
    description: 'Merge form fields and annotations into page content.',
    icon: <Shapes className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    description: 'Rearrange, delete or add pages with visual editor.',
    icon: <Grid className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'metadata-editor',
    name: 'Metadata Editor',
    description: 'Change author, title, and keywords of your PDF.',
    icon: <Settings className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'dark-mode-pdf',
    name: 'Dark Mode PDF',
    description: 'Invert document colors for comfortable night reading.',
    icon: <Eye className="w-8 h-8" />,
    category: 'optimize',
    color: 'bg-theme-primarySoft'
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    description: 'Remove password and permissions from secured PDFs.',
    icon: <Unlock className="w-8 h-8" />,
    category: 'security',
    color: 'bg-theme-primarySoft'
  }
];
