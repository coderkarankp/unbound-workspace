// This worker handles CPU-intensive PDF encryption using QPDF WASM
// It is lazy-loaded to keep the main bundle small.

import { QPDF } from 'https://esm.sh/@file-forge/qpdf-wasm@0.0.1';

self.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, password, fileName } = e.data;

  try {
    self.postMessage({ type: 'status', msg: 'Initializing security engine...' });
    
    // Initialize QPDF
    const qpdf = await QPDF.create();

    self.postMessage({ type: 'status', msg: 'Mounting virtual transmission...' });
    
    // Write the input file to the virtual filesystem
    const inputPath = 'input.pdf';
    const outputPath = 'protected.pdf';
    qpdf.fs.writeFile(inputPath, new Uint8Array(fileBuffer));

    self.postMessage({ type: 'status', msg: 'Applying AES-256 encryption...' });

    // Execute QPDF command
    // --encrypt [user-password] [owner-password] [key-length] -- [input] [output]
    // We set user and owner password to the same for simplicity in this tool
    await qpdf.run([
      '--encrypt', 
      password, 
      password, 
      '256', 
      '--', 
      inputPath, 
      outputPath
    ]);

    self.postMessage({ type: 'status', msg: 'Finalizing protected document...' });

    // Read the result from the virtual filesystem
    const result = qpdf.fs.readFile(outputPath);

    // Cleanup virtual FS
    qpdf.fs.unlink(inputPath);
    qpdf.fs.unlink(outputPath);

    // FIX: Cast self to any to resolve TypeScript overload collision between Window and Worker postMessage
    (self as any).postMessage({ 
      type: 'completed', 
      bytes: result,
      fileName: fileName.replace('.pdf', '_protected.pdf')
    }, [result.buffer]);

  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message || 'Encryption failed' });
  }
};