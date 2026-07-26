import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { CaseProvider } from './context/CaseContext';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import IntakePage from './pages/IntakePage';
import AssistantPage from './pages/AssistantPage';
import AnalysisPage from './pages/AnalysisPage';

export default function App() {
  return (
    <CaseProvider>
      <HashRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/intake" element={<IntakePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </MainLayout>
      </HashRouter>
    </CaseProvider>
  );
}
