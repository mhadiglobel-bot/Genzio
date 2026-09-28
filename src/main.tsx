import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { storageService } from './services/storageService';
import { applyThemeToDOM } from './services/themeService';

// Hydrate saved appearance settings immediately to prevent theme flashing on load
try {
  const initialSettings = storageService.loadAppSettings();
  applyThemeToDOM(
    {
      mode: initialSettings.general.mode,
      accent: initialSettings.general.accent,
      accentSecondary: initialSettings.general.accentSecondary,
      bgImage: initialSettings.general.bgImage,
      bgOpacity: initialSettings.general.bgOpacity,
      bgBlur: initialSettings.general.bgBlur,
      fontFamily: initialSettings.accessibility?.fontFamily || initialSettings.general.fontFamily,
      fontSize: initialSettings.accessibility?.fontSize || initialSettings.general.fontSize,
      speechRate: initialSettings.voice.speechRate,
      speechVoice: initialSettings.voice.speechVoice,
      autoReadSpeech: initialSettings.voice.autoReadSpeech,
    },
    initialSettings
  );
} catch (e) {
  console.warn('Initial theme hydration notice:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

