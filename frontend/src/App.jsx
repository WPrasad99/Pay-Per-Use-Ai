import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';

import Home from './pages/Home';
import OnboardingPage from './pages/OnboardingPage';
import WorkspacePage from './pages/WorkspacePage';
import SharedChatPage from './pages/SharedChatPage';

function App() {
  const location = useLocation();
  const isWorkspace = location.pathname.startsWith('/dashboard');

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // ensures splash appears instantly
    requestAnimationFrame(() => {
      const t1 = setTimeout(() => setFadeOut(true), 700);
      const t2 = setTimeout(() => setLoading(false), 900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* SPLASH OVERLAY (no white flash) */}
      {loading && (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          <SplashScreen />
        </div>
      )}

      {/* NAVBAR */}
      {!isWorkspace && <Navbar />}

      {/* MAIN CONTENT */}
      <main className={isWorkspace ? "h-screen" : "flex-grow"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<WorkspacePage />} />
          <Route path="/dashboard/:serviceId" element={<WorkspacePage />} />
          <Route path="/shared/:id" element={<SharedChatPage />} />
        </Routes>
      </main>

      {/* FOOTER */}
      {!isWorkspace && <Footer />}

    </div>
  );
}

export default App;