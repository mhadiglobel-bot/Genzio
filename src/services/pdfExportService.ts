import { exportChatToPdfFile } from './chatExportService';
import { ChatSession } from '../types';

export function exportChatToPrintablePdf(session: ChatSession): void {
  exportChatToPdfFile(session);
}
