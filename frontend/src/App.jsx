import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import OnboardingPage from './pages/OnboardingPage';
import WorkspacePage from './pages/WorkspacePage';
import SharedChatPage from './pages/SharedChatPage';

function App() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {!isWorkspace && <Navbar />}
      <main className={isWorkspace ? "h-screen" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/code_review" replace />} />
          <Route path="/dashboard/:serviceId" element={<WorkspacePage />} />
          <Route path="/shared/:id" element={<SharedChatPage />} />
        </Routes>
      </main>
      {!isWorkspace && <Footer />}
    </div>
  );
}

export default App;
