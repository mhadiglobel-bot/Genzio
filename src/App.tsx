import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GenzioChatPage } from './pages/GenzioChatPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Main Genzio AI Chatbot Application */}
          <Route path="/" element={<GenzioChatPage />} />
          <Route path="/genzio" element={<GenzioChatPage />} />
          <Route path="/c/:chatId" element={<GenzioChatPage />} />
          <Route path="/share/:chatId" element={<GenzioChatPage />} />

          {/* Fallback to Chat */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
