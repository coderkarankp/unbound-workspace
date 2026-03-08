
import React from 'react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'convert' | 'optimize' | 'edit';
  color: string;
}

export interface FileState {
  id: string;
  file: File;
  preview?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  originalSize: number;
  processedSize?: number;
  result?: any;
}

export type ToolID = 
  | 'merge-pdf' 
  | 'split-pdf' 
  | 'compress-pdf' 
  | 'rotate-pdf'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'organize-pdf'
  | 'metadata-editor';
