import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata = {
  title: { default: 'AudioStudio Pro | Browser Audio Editor', template: '%s | AudioStudio Pro' },
  description: 'Edit MP3 and audio in your browser with timeline cuts, section-based echo, delay, bass, gain and 320 kbps MP3 export.',
  keywords: ['online audio editor','mp3 editor','audio cutter','echo editor','delay audio','bass boost','320 kbps mp3'],
  metadataBase: new URL('https://example.com'),
  openGraph: {
    title: 'AudioStudio Pro',
    description: 'Timeline-based browser audio editor with section-specific effects and MP3 export.',
    type: 'website'
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Nav />{children}<Footer /></body></html>;
}
