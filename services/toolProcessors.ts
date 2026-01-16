
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';
import { reconstructAsWord, summarizeDocument, performOCR, translateText, scanBarcodes, extractTableData, extractJSON } from './geminiService';

export interface ProcessorParams {
  id: string;
  files: any[];
  config: any;
  updateStatus: (id: string, status: string, progress: number) => void;
  setCurrentMsg: (msg: string) => void;
}

const parseTextToDocxChildren = (text: string) => {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return new Paragraph({ text: trimmed.replace('# ', ''), heading: HeadingLevel.HEADING_1 });
    if (trimmed.startsWith('## ')) return new Paragraph({ text: trimmed.replace('## ', ''), heading: HeadingLevel.HEADING_2 });
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) return new Paragraph({ children: [new TextRun(trimmed.replace(/^[*|-]\s/, ''))], bullet: { level: 0 } });
    return new Paragraph({ children: [new TextRun(line)] });
  });
};

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

export const runToolProcessor = async (params: ProcessorParams) => {
  const { id, files, config, updateStatus, setCurrentMsg } = params;
  const results: any[] = [];

  // Handle Multi-file Merging Tools First
  if (id === 'merge-pdf') {
    setCurrentMsg("Merging files...");
    const mergedPdf = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      updateStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
      const donor = await PDFDocument.load(await f.file.arrayBuffer());
      const donorPages = await mergedPdf.copyPages(donor, donor.getPageIndices());
      donorPages.forEach(p => mergedPdf.addPage(p));
    }
    const bytes = await mergedPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return [{ id: 'merged', name: 'merged.pdf', blob, url: URL.createObjectURL(blob) }];
  }

  if (id === 'jpg-to-pdf') {
    setCurrentMsg("Creating PDF...");
    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      updateStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
      const imgBytes = await f.file.arrayBuffer();
      const img = f.file.type === 'image/png' ? await merged.embedPng(imgBytes) : await merged.embedJpg(imgBytes);
      const page = merged.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const bytes = await merged.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return [{ id: 'combined', name: 'combined.pdf', blob, url: URL.createObjectURL(blob) }];
  }

  // Handle Single-file Parallel Processing
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    setCurrentMsg(`Processing: ${f.file.name}`);
    updateStatus(f.id, 'processing', 20);
    const fileBuffer = await f.file.arrayBuffer();
    const base64 = btoa(new Uint8Array(fileBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
    
    let res: any = { id: f.id, name: f.file.name };

    switch (id) {
      case 'pdf-to-word':
        const wordText = await reconstructAsWord(base64, 'application/pdf');
        const docObj = new Document({ sections: [{ children: parseTextToDocxChildren(wordText) }] });
        const buffer = await Packer.toBuffer(docObj);
        res.blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        res.name = f.file.name.replace('.pdf', '.docx');
        break;

      case 'split-pdf':
        const splitSrc = await PDFDocument.load(fileBuffer);
        const splitPages: any[] = [];
        if (config.splitMode === 'individual') {
          for (const pNum of config.selectedPages) {
            const newPdf = await PDFDocument.create();
            const [copied] = await newPdf.copyPages(splitSrc, [pNum - 1]);
            newPdf.addPage(copied);
            const bytes = await newPdf.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            splitPages.push({ pageNum: pNum, blob, url: URL.createObjectURL(blob) });
          }
          // Special return for split individual mode
          return { type: 'split-result', pages: splitPages, name: f.file.name };
        } else {
          const newPdf = await PDFDocument.create();
          const copied = await newPdf.copyPages(splitSrc, config.selectedPages.map((p: number) => p - 1));
          copied.forEach(p => newPdf.addPage(p));
          const bytes = await newPdf.save();
          res.blob = new Blob([bytes], { type: 'application/pdf' });
          res.name = f.file.name.replace('.pdf', '_extracted.pdf');
        }
        break;

      case 'watermark-pdf':
        const wmDoc = await PDFDocument.load(fileBuffer);
        const wmPages = wmDoc.getPages();
        const font = await wmDoc.embedFont(StandardFonts.HelveticaBold);
        let embeddedImg: any = null;
        if (config.watermarkType === 'image' && config.watermarkImage) {
           const binary = atob(config.watermarkImage.split(',')[1]);
           const bytes = new Uint8Array(binary.length);
           for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
           embeddedImg = config.watermarkImage.includes('image/png') ? await wmDoc.embedPng(bytes) : await wmDoc.embedJpg(bytes);
        }

        config.selectedPages.forEach((pIdx: number) => {
          const page = wmPages[pIdx - 1];
          const { width, height } = page.getSize();
          if (config.watermarkType === 'text') {
            const tw = font.widthOfTextAtSize(config.watermarkText, config.watermarkSize);
            page.drawText(config.watermarkText, {
              x: width / 2 - tw / 2, y: height / 2,
              size: config.watermarkSize, font, color: hexToRgb(config.watermarkColor),
              opacity: config.watermarkOpacity, rotate: degrees(config.watermarkRotation)
            });
          } else if (embeddedImg) {
            const scale = config.watermarkSize / 100;
            const iw = embeddedImg.width * scale;
            const ih = embeddedImg.height * scale;
            page.drawImage(embeddedImg, {
              x: width / 2 - iw / 2, y: height / 2 - ih / 2,
              width: iw, height: ih, opacity: config.watermarkOpacity, rotate: degrees(config.watermarkRotation)
            });
          }
        });
        const wmBytes = await wmDoc.save();
        res.blob = new Blob([wmBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_watermarked.pdf');
        break;

      case 'ai-summarize':
        const summText = await performOCR(base64, 'application/pdf');
        const summary = await summarizeDocument(summText);
        res.blob = new Blob([summary], { type: 'text/markdown' });
        res.name = f.file.name.replace('.pdf', '_summary.md');
        break;

      case 'rotate-pdf':
        const rotDoc = await PDFDocument.load(fileBuffer);
        config.selectedPages.forEach((pIdx: number) => {
          const p = rotDoc.getPages()[pIdx - 1];
          p.setRotation(degrees((p.getRotation().angle + config.rotateAngle) % 360));
        });
        const rotBytes = await rotDoc.save();
        res.blob = new Blob([rotBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_rotated.pdf');
        break;

      default:
        res.content = "Not supported yet.";
    }

    if (res.blob) res.url = URL.createObjectURL(res.blob);
    results.push(res);
    updateStatus(f.id, 'completed', 100);
  }

  return results;
};
