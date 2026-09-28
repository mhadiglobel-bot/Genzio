import { toBlob } from 'html-to-image';

/**
 * Captures a specific DOM element as a high-quality PNG image file and downloads it directly to PC.
 * Uses html-to-image (SVG foreignObject) to fully support modern CSS functions like oklch(), modern gradients, etc.
 */
export async function captureElementToPng(
  element: HTMLElement,
  fileName = 'genzio-chat-snapshot.png'
): Promise<boolean> {
  try {
    const blob = await toBlob(element, {
      backgroundColor: '#131314',
      pixelRatio: window.devicePixelRatio > 1 ? 2 : 1.5,
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          if (
            node.classList?.contains('no-snapshot') ||
            node.getAttribute?.('data-no-snapshot') === 'true'
          ) {
            return false;
          }
        }
        return true;
      },
    });

    if (!blob) {
      console.error('Failed to generate PNG blob from element.');
      return false;
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Failed to capture snapshot:', error);
    return false;
  }
}
