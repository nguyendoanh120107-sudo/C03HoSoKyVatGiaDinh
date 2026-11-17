/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Layout } from './components/Layout';
import { ArchiveProvider } from './context/ArchiveContext';
import { AboutAndAuditPage } from './pages/AboutAndAuditPage';
import { AcceptanceDashboardPage } from './pages/AcceptanceDashboardPage';
import { ArtifactDetailPage } from './pages/ArtifactDetailPage';
import { CatalogPage } from './pages/CatalogPage';
import { GeminiAssistantPage } from './pages/GeminiAssistantPage';
import { HomePage } from './pages/HomePage';
import { ManageArtifactsPage } from './pages/ManageArtifactsPage';
import { RightsAndPreservationPage } from './pages/RightsAndPreservationPage';
import { SourcesPage } from './pages/SourcesPage';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ArchiveProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/kho-ky-vat" element={<CatalogPage />} />
              <Route path="/kho-hien-vat" element={<CatalogPage />} />
              <Route path="/ky-vat/:id" element={<ArtifactDetailPage />} />
              <Route path="/quan-ly" element={<ManageArtifactsPage />} />
              <Route path="/tro-ly-ai" element={<GeminiAssistantPage />} />
              <Route path="/nguon-tu-lieu" element={<SourcesPage />} />
              <Route
                path="/quyen-va-bao-quan"
                element={<RightsAndPreservationPage />}
              />
              <Route
                path="/quyen-cong-bo"
                element={<RightsAndPreservationPage />}
              />
              <Route path="/gioi-thieu" element={<AboutAndAuditPage />} />
              <Route path="/nghiem-thu" element={<AcceptanceDashboardPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ArchiveProvider>
    </MotionConfig>
  );
}
