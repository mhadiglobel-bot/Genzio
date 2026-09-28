import { jsPDF } from 'jspdf';
import { ChatSession } from '../types';

/**
 * Sanitizes a title string into a safe, clean file name
 */
function sanitizeFileName(title: string): string {
  const clean = title
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
  return clean ? `genzio_${clean}` : 'genzio_chat';
}

/**
 * Directly downloads the conversation as a clean, professionally formatted PDF file on the user's PC.
 */
export function exportChatToPdfFile(session: ChatSession): boolean {
  if (!session || !session.messages || session.messages.length === 0) {
    throw new Error('Conversation has no messages to export.');
  }

  // Initialize jsPDF (A4 portrait in millimeters)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const leftMargin = 16;
  const rightMargin = 16;
  const topMargin = 20;
  const bottomMargin = 20;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 178mm

  let currentY = topMargin;

  // Helper: check if we need a new page
  const ensureSpace = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = topMargin;
    }
  };

  // --- 1. First Page Header ---
  // Cyan Accent Line at the top
  doc.setFillColor(8, 145, 178); // cyan-600
  doc.rect(leftMargin, currentY, contentWidth, 2, 'F');
  currentY += 8;

  // Genzio AI Brand Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('GENZIO', leftMargin, currentY);

  const genzioWidth = doc.getTextWidth('GENZIO ');
  doc.setTextColor(8, 145, 178); // cyan-600
  doc.text('AI', leftMargin + genzioWidth, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const exportDateStr = new Date(session.createdAt || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Exported: ${exportDateStr}`, pageWidth - rightMargin, currentY, { align: 'right' });
  currentY += 8;

  // Session Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // slate-800
  const splitTitle = doc.splitTextToSize(session.title || 'Untitled Conversation', contentWidth);
  doc.text(splitTitle, leftMargin, currentY);
  currentY += splitTitle.length * 6 + 2;

  // Session Meta (Model & Count)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const modelName = session.model || 'Genzio Advanced';
  doc.text(
    `Model: ${modelName}  •  Total Messages: ${session.messages.length}`,
    leftMargin,
    currentY
  );
  currentY += 6;

  // Header bottom border
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
  currentY += 10;

  // --- 2. Messages Loop ---
  session.messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const senderLabel = isUser ? 'You (User)' : 'Genzio AI';
    const senderColor: [number, number, number] = isUser ? [2, 132, 199] : [8, 145, 178];

    ensureSpace(24);

    // Sender Tag & Timestamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(senderColor[0], senderColor[1], senderColor[2]);
    doc.text(senderLabel, leftMargin + 4, currentY);

    if (msg.timestamp) {
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(timeStr, pageWidth - rightMargin - 4, currentY, { align: 'right' });
    }
    currentY += 5;

    // Parse content for code blocks vs normal text
    const textParts = msg.content.split(/(```[\s\S]*?```)/g);

    textParts.forEach((part) => {
      if (!part.trim()) return;

      const codeMatch = part.match(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/);
      if (codeMatch) {
        // --- Code Block Rendering ---
        const lang = (codeMatch[1] || 'Code').toUpperCase();
        const rawCode = codeMatch[2].trimEnd();

        ensureSpace(20);

        // Code Header bar
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(leftMargin + 2, currentY, contentWidth - 4, 6, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(56, 189, 248); // sky-400
        doc.text(lang, leftMargin + 6, currentY + 4.2);
        currentY += 6;

        // Code Lines
        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(226, 232, 240); // slate-200

        const codeLines = doc.splitTextToSize(rawCode, contentWidth - 12);
        const blockHeight = codeLines.length * 4.2 + 4;

        // Background box for code lines
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(leftMargin + 2, currentY, contentWidth - 4, blockHeight, 'F');

        let codeY = currentY + 3.5;
        for (let i = 0; i < codeLines.length; i++) {
          if (codeY > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = topMargin;
            doc.setFillColor(15, 23, 42);
            doc.rect(leftMargin + 2, currentY, contentWidth - 4, blockHeight, 'F');
            codeY = currentY + 3.5;
          }
          doc.text(codeLines[i], leftMargin + 6, codeY);
          codeY += 4.2;
        }

        currentY = codeY + 3;
      } else {
        // --- Normal Text Rendering ---
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59); // slate-800

        // Clean out excessive whitespace or stray markdown asterisks if desired
        const cleanText = part
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .trim();

        const paragraphs = cleanText.split('\n');

        paragraphs.forEach((p) => {
          if (!p.trim()) {
            currentY += 2;
            return;
          }
          const lines = doc.splitTextToSize(p, contentWidth - 8);

          for (let i = 0; i < lines.length; i++) {
            ensureSpace(5.5);
            doc.text(lines[i], leftMargin + 4, currentY);
            currentY += 4.8;
          }
          currentY += 1.5;
        });
      }
    });

    currentY += 4;

    // Message separator (if not last message)
    if (idx < session.messages.length - 1) {
      ensureSpace(8);
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.4);
      doc.line(leftMargin + 4, currentY, pageWidth - rightMargin - 4, currentY);
      currentY += 8;
    }
  });

  // --- 3. Running Footers on All Pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, pageHeight - 12, pageWidth - rightMargin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Exported from Genzio AI Assistant', leftMargin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - rightMargin, pageHeight - 7, {
      align: 'right',
    });
  }

  // --- 4. Direct PC Download ---
  const fileName = `${sanitizeFileName(session.title)}.pdf`;

  try {
    // Generate Blob and trigger direct browser download
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch {
    // Fallback directly to jsPDF built-in save
    doc.save(fileName);
    return true;
  }
}

// Alias for backward compatibility
export const exportChatToPrintablePdf = exportChatToPdfFile;

/**
 * Exports the entire conversation as a real, downloadable Markdown (.md) file directly to PC.
 */
export function exportChatToMarkdown(session: ChatSession): boolean {
  if (!session || !session.messages || session.messages.length === 0) {
    throw new Error('Conversation has no messages to export.');
  }

  const dateStr = new Date(session.createdAt || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# ${session.title}\n\n`;
  md += `*Exported from Genzio AI on ${dateStr}*\n\n`;
  md += `**Model:** ${session.model || 'Genzio Advanced'}\n\n`;
  md += `---\n\n`;

  session.messages.forEach((msg) => {
    const isUser = msg.role === 'user';
    const roleTitle = isUser ? '## User' : '## Genzio AI';
    const timeStr = msg.timestamp
      ? ` *(${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})*`
      : '';

    md += `${roleTitle}${timeStr}\n\n`;
    md += `${msg.content.trim()}\n\n`;
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${sanitizeFileName(session.title)}.md`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
