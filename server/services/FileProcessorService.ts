import * as pdfParseModule from 'pdf-parse';

// Handle CommonJS / ESM export interop for pdf-parse
const pdfParse: any = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule as any).default || pdfParseModule;

export interface ProcessedFileResult {
  id: string;
  name: string;
  type: string;
  size: number;
  fileCategory: 'image' | 'pdf' | 'document' | 'csv';
  dataUrl?: string;
  extractedText?: string;
  pageCount?: number;
  isScanned?: boolean;
  status: 'ready' | 'error';
  errorMessage?: string;
}

function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');
    const matches: string[] = [];

    // Match text inside Parentheses in PDF string objects (text) Tj or [(text)] TJ
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        // Unescape standard PDF escapes
        const unescaped = match[1]
          .replace(/\\\( /g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t');
        matches.push(unescaped.trim());
      }
    }

    // Match ASCII printable words in stream chunks if regex didn't find Tj
    if (matches.length < 5) {
      const asciiWords = raw.match(/[A-Za-z0-9\+\-\*\/\=\.\,\:\;]{3,}/g) || [];
      const filtered = asciiWords.filter(
        (w) =>
          !/^(PDF|endobj|stream|endstream|obj|xref|trailer|Catalog|Pages|Page|Type|Font|FontDescriptor|ProcSet|MediaBox)$/i.test(
            w
          )
      );
      if (filtered.length > 0) {
        matches.push(...filtered.slice(0, 300));
      }
    }

    return matches.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

export class FileProcessorService {
  /**
   * Processes an uploaded file buffer or base64 string and converts it into
   * model-ready data (extracted structured text or multimodal image dataUrl).
   */
  public async processFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<ProcessedFileResult> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const size = fileBuffer.length;
    const lowerName = filename.toLowerCase();

    // 1. IMAGES (PNG, JPG, JPEG, WEBP, GIF)
    if (
      mimeType.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(lowerName)
    ) {
      const normalizedMime = mimeType.startsWith('image/')
        ? mimeType
        : lowerName.endsWith('.png')
        ? 'image/png'
        : lowerName.endsWith('.webp')
        ? 'image/webp'
        : lowerName.endsWith('.gif')
        ? 'image/gif'
        : 'image/jpeg';

      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${normalizedMime};base64,${base64}`;

      return {
        id,
        name: filename,
        type: normalizedMime,
        size,
        fileCategory: 'image',
        dataUrl,
        status: 'ready',
      };
    }

    // 2. PDF DOCUMENTS (Resilient multi-level extraction + multimodal dataUrl)
    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
      let pageCount = 1;
      let rawText = '';
      const base64 = fileBuffer.toString('base64');
      const pdfDataUrl = `data:application/pdf;base64,${base64}`;

      // Level 1: Standard pdf-parse
      try {
        const pdfData = await pdfParse(fileBuffer);
        pageCount = pdfData.numpages || 1;
        rawText = (pdfData.text || '').trim();
      } catch (pdfErr: any) {
        console.warn(`[FileProcessorService] pdf-parse notice for ${filename}:`, pdfErr?.message || pdfErr);
      }

      // Level 2: Raw stream text extraction fallback if rawText is sparse
      if (!rawText || rawText.length < 25) {
        const fallbackText = extractRawTextFromPdfBuffer(fileBuffer);
        if (fallbackText && fallbackText.length > rawText.length) {
          rawText = fallbackText;
        }
      }

      // Level 3: Format extracted content
      const cleanedText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const structuredContent =
        cleanedText.length >= 10
          ? `[PDF Document: ${filename} | ${pageCount} pages]\n\n${cleanedText}`
          : `[PDF Document: ${filename} | ${pageCount} page(s)]\n\n[Visual / Table PDF Attachment: Contains printable tables or visual worksheet figures.]`;

      return {
        id,
        name: filename,
        type: 'application/pdf',
        size,
        fileCategory: 'pdf',
        dataUrl: pdfDataUrl,
        extractedText: structuredContent,
        pageCount,
        status: 'ready',
      };
    }

    // 3. CSV FILES
    if (
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      lowerName.endsWith('.csv')
    ) {
      try {
        const utf8Text = fileBuffer.toString('utf-8');
        const lines = utf8Text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length === 0) {
          return {
            id,
            name: filename,
            type: 'text/csv',
            size,
            fileCategory: 'csv',
            status: 'error',
            errorMessage: 'CSV file appears to be empty.',
          };
        }

        // Convert CSV lines to structured Markdown table representation
        const tableRows = lines.slice(0, 150).map((line) => {
          const cells = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          return `| ${cells.join(' | ')} |`;
        });

        const headerLine = tableRows[0];
        const cellCount = (lines[0].match(/,/g) || []).length + 1;
        const separator = `| ${Array(cellCount).fill('---').join(' | ')} |`;

        const formattedCsv = [
          `[CSV Spreadsheet: ${filename} (${lines.length} rows)]`,
          headerLine,
          separator,
          ...tableRows.slice(1),
        ].join('\n');

        return {
          id,
          name: filename,
          type: 'text/csv',
          size,
          fileCategory: 'csv',
          extractedText: formattedCsv,
          status: 'ready',
        };
      } catch (err: any) {
        return {
          id,
          name: filename,
          type: 'text/csv',
          size,
          fileCategory: 'csv',
          status: 'error',
          errorMessage: 'Failed to read CSV content.',
        };
      }
    }

    // 4. TEXT / MARKDOWN / JSON / CODE DOCUMENTS
    if (
      mimeType.startsWith('text/') ||
      /\.(txt|md|json|js|ts|tsx|jsx|html|css|py|java|c|cpp|sql|yaml|yml)$/i.test(
        lowerName
      )
    ) {
      try {
        const textContent = fileBuffer.toString('utf-8');
        const structuredText = `[File: ${filename}]\n\`\`\`\n${textContent}\n\`\`\``;

        return {
          id,
          name: filename,
          type: mimeType || 'text/plain',
          size,
          fileCategory: 'document',
          extractedText: structuredText,
          status: 'ready',
        };
      } catch {
        return {
          id,
          name: filename,
          type: mimeType || 'text/plain',
          size,
          fileCategory: 'document',
          status: 'error',
          errorMessage: 'Unable to decode text document.',
        };
      }
    }

    // Unsupported File Type
    return {
      id,
      name: filename,
      type: mimeType || 'application/octet-stream',
      size,
      fileCategory: 'document',
      status: 'error',
      errorMessage: `Unsupported file format. Please upload PNG, JPG, WEBP, PDF, CSV, TXT, or MD files.`,
    };
  }
}

export const fileProcessorService = new FileProcessorService();
