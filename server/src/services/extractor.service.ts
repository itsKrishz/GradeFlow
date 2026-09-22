import fs from 'fs';
import path from 'path';

export interface ExtractedDocumentResult {
  text: string;
  wordCount: number;
  pageCount?: number;
  extractedAt: Date;
}

/**
 * Service to extract textual contents from uploaded student submissions
 */
export async function extractDocumentText(filePath: string): Promise<ExtractedDocumentResult> {
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  let rawText = '';
  let pageCount = 1;

  if (ext === '.pdf') {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      // Support both function-based and class-based pdf-parse exports
      const pdfParseModule = require('pdf-parse');
      if (typeof pdfParseModule === 'function') {
        const res = await pdfParseModule(dataBuffer);
        rawText = res.text || '';
        pageCount = res.numpages || 1;
      } else if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
        const res = await parser.getText();
        rawText = typeof res === 'string' ? res : (res?.text || '');
      }
    } catch (pdfErr: any) {
      console.warn('[PDF Extract Warning]:', pdfErr.message);
      rawText = `[PDF Document: ${path.basename(filePath)}]`;
    }
  } else if (['.sql', '.py', '.java', '.cpp', '.c', '.txt', '.json', '.md'].includes(ext)) {
    rawText = await fs.promises.readFile(filePath, 'utf-8');
  } else if (['.zip', '.tar', '.gz'].includes(ext)) {
    rawText = `[Archive submission: ${path.basename(filePath)} containing packaged source code]`;
  } else {
    try {
      rawText = await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      rawText = `[Binary submission: ${path.basename(filePath)}]`;
    }
  }

  // Clean excess whitespace
  const sanitizedText = rawText.replace(/\r\n/g, '\n').trim();
  const wordCount = sanitizedText.length > 0 ? sanitizedText.split(/\s+/).length : 0;

  return {
    text: sanitizedText,
    wordCount,
    pageCount,
    extractedAt: new Date(),
  };
}
