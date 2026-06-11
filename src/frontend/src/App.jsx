import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import OnboardingPage from './pages/OnboardingPage';
import WorkspacePage from './pages/WorkspacePage';
import SharedChatPage from './pages/SharedChatPage';

// Lazy-loaded marketplace pages
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const CreateAgentPage = lazy(() => import('./pages/CreateAgentPage'));
const MyAgentsPage = lazy(() => import('./pages/MyAgentsPage'));
const EarningsDashboard = lazy(() => import('./pages/EarningsDashboard'));
const CreatorProfilePage = lazy(() => import('./pages/CreatorProfilePage'));

function App() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {!isWorkspace && <Navbar />}
      <main className={isWorkspace ? "h-screen" : "flex-grow"}>
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#fff7df]"><p className="text-xl font-black">Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<WorkspacePage />} />
            <Route path="/dashboard/:serviceId" element={<WorkspacePage />} />
            <Route path="/shared/:id" element={<SharedChatPage />} />
            {/* Marketplace Routes */}
            <Route path="/dashboard/marketplace" element={<MarketplacePage />} />
            <Route path="/dashboard/create-agent" element={<CreateAgentPage />} />
            <Route path="/dashboard/my-agents" element={<MyAgentsPage />} />
            <Route path="/dashboard/earnings" element={<EarningsDashboard />} />
            <Route path="/creator/:wallet" element={<CreatorProfilePage />} />
          </Routes>
        </Suspense>
      </main>
      {!isWorkspace && <Footer />}
    </div>
  );
}

export default App;

