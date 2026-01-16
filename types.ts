
import React from 'react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'convert' | 'optimize' | 'edit' | 'security' | 'ai';
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
  | 'pdf-to-word' 
  | 'word-to-pdf' 
  | 'merge-pdf' 
  | 'split-pdf' 
  | 'compress-pdf' 
  | 'ai-summarize' 
  | 'pdf-translate'
  | 'protect-pdf'
  | 'rotate-pdf'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'pdf-to-ppt'
  | 'pdf-to-excel'
  | 'pdf-to-json'
  | 'watermark-pdf';
