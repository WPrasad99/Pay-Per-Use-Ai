import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { peraWallet } from '../config/peraWallet';
import { getUserProfile, getNonce, verifySiwa, registerUser } from '../api/client';

// Read the persisted wallet (same 24h logic as Navbar)
const getPersistedWallet = () => {
  const addr = localStorage.getItem('wallet_address');
  const expiry = localStorage.getItem('wallet_expiry');
  if (!addr || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_expiry');
    return null;
  }
  return addr;
};

const persistWallet = (addr) => {
  localStorage.setItem('wallet_address', addr);
  localStorage.setItem('wallet_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
  sessionStorage.setItem('wallet_address', addr);
};
import LiveTicker from "../components/LiveTicker";
import { motion } from "framer-motion";
import Reveal from "../components/Reveal";


const STEPS = [
  { num: '01', title: 'Pick a task, not a plan', desc: 'Choose the AI worker you need for one job: code, analysis, writing, support, or content.', icon: '🎯' },
  { num: '02', title: 'Authorize only the spend', desc: 'Connect Pera Wallet and approve a tiny ALGO allowance. No subscription, no surprise renewal.', icon: '🛡️' },
  { num: '03', title: 'Get the result + proof', desc: 'The request is unlocked after on-chain verification, so teams can audit every paid usage.', icon: '⚡' },
];

const FEATURES = [
  { icon: '🔗', title: 'On-chain proof of usage', desc: 'Each paid action is tied to Algorand verification, making spend easier to audit.' },
  { icon: '💸', title: 'True pay-per-use pricing', desc: 'A practical fit for SMEs, colleges, agencies, and teams that cannot justify monthly AI seats.' },
  { icon: '🔐', title: 'Wallet-first access', desc: 'Reduce account friction while keeping payment consent explicit through Pera Wallet.' },
  { icon: '📈', title: 'Usage dashboard', desc: 'Track balance, sessions, history, and analytics from one focused workspace.' },
  { icon: '🧠', title: 'Task-specific AI workers', desc: 'Services are packaged around real outcomes instead of a blank generic chatbot.' },
  { icon: '🧾', title: 'Enterprise-ready transparency', desc: 'Clear pricing, transaction proof, and explainable flow help build industry trust.' },
];

const ABOUT_FEATURES = [
  {
    icon: "⚡",
    title: "Multi-Model Intelligence",
    desc: "Switch seamlessly between GPT-4o, Gemini 1.5, Llama 3, and Qwen inside one persistent conversation without losing context.",
  },
  {
    icon: "🔗",
    title: "Smart Sessions",
    desc: "Authorize once and interact continuously for 24 hours using blockchain-based session management with zero repeated approvals.",
  },
  {
    icon: "💸",
    title: "Usage-Based Billing",
    desc: "Pay only for the exact AI tokens you consume instead of expensive monthly subscriptions.",
  },
  {
    icon: "🚀",
    title: "Future AI Economy",
    desc: "A decentralized infrastructure for AI orchestration, NFT ownership, and wallet-native intelligence systems.",
  },
];





const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
    y: 40,
    rotate: -6,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
  },
};




const TRUST_STATS = [
  { value: '0', label: 'subscription lock-in' },
  { value: '1 tx', label: 'verifiable payment proof' },
  { value: '24h', label: 'session allowance window' },
];

const Home = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(() => !!getPersistedWallet());
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({ name: '', dob: '', email: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsWalletConnected(!!getPersistedWallet());
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    if (isConnecting) return;
    // If already connected, just go to workspace
    if (getPersistedWallet()) {
      navigate('/dashboard');
      return;
    }
    setIsConnecting(true);
    try {
      let accounts = [];
      try { accounts = await peraWallet.reconnectSession(); } catch (_) { }
      if (!accounts || accounts.length === 0) accounts = await peraWallet.connect();
      if (!accounts || accounts.length === 0) throw new Error('Connection cancelled.');
      peraWallet.connector?.on('disconnect', () => {
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_expiry');
        sessionStorage.clear();
        setIsWalletConnected(false);
      });
      const addr = accounts[0];
      const { nonce } = await getNonce(addr);
      const message = `PayPerAI Sign-In\nWallet: ${addr}\nNonce: ${nonce}`;
      const msgBytes = new TextEncoder().encode(message);
      const signedData = await peraWallet.signData([{ data: msgBytes, message }], addr);
      const sigBytes = signedData[0] instanceof Uint8Array
        ? signedData[0]
        : new Uint8Array(Object.values(signedData[0]));
      const sigB64 = btoa(Array.from(sigBytes, b => String.fromCharCode(b)).join(''));
      await verifySiwa(addr, message, sigB64);
      persistWallet(addr);
      setIsWalletConnected(true);
      try {
        await getUserProfile(addr);
        const redirectPath = sessionStorage.getItem('onboarding_redirect') || '/dashboard';
        sessionStorage.removeItem('onboarding_redirect');
        navigate(redirectPath);
      } catch (err) {
        if (err.status === 404 || (err.message && err.message.toLowerCase().includes('not found'))) {
          setShowOnboarding(true);
        } else throw err;
      }
    } catch (err) {
      if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        alert('Connection failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const addr = getPersistedWallet();
      await registerUser(addr, onboardingData.name, onboardingData.dob, onboardingData.email);
      setShowOnboarding(false);
      const redirectPath = sessionStorage.getItem('onboarding_redirect') || '/dashboard/marketplace';
      sessionStorage.removeItem('onboarding_redirect');
      navigate(redirectPath);
    } catch (err) {
      alert('Registration failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartMakingAgents = async () => {
    if (isConnecting) return;
    const persisted = getPersistedWallet();
    if (persisted) {
      navigate('/dashboard/create-agent');
      return;
    }
    sessionStorage.setItem('onboarding_redirect', '/dashboard/create-agent');
    await handleConnect();
  };

  const handleExploreMarketplace = async () => {
    if (isConnecting) return;
    const persisted = getPersistedWallet();
    if (persisted) {
      navigate('/dashboard/marketplace');
      return;
    }
    sessionStorage.setItem('onboarding_redirect', '/dashboard/marketplace');
    await handleConnect();
  };

  return (
    <div
      className={`overflow-x-hidden bg-neo-cream text-neo-ink transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >

      {/* HERO */}
      <section className="relative min-h-screen px-4 sm:px-5 pt-32 pb-16 md:px-8 flex items-center">
        <div className="neo-grid absolute inset-0 opacity-70" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-[45px] grid-cols-1 lg:grid-cols-[1.06fr_0.94fr]">

          {/* LEFT */}

          <div>
            <div className='mt-2 md:mt-5'>
              <div className="mb-6 inline-flex items-center gap-2 border-4 border-neo-ink bg-white px-4 py-2 font-black uppercase tracking-[0.18em] shadow-brutal-sm">
                <span className="h-3 w-3 rounded-full bg-neo-green ring-2 ring-neo-ink" />
                Trustworthy Pay-Per-Use AI
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-[-0.06em]">
              Industrial AI without the subscription trap.
            </h1>

            <p className="mt-6 max-w-2xl text-base md:text-xl font-semibold text-neo-muted">
              PayPerAI turns premium AI into auditable micro-services.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-primary"
              >
                {isConnecting ? 'Connecting...' : isWalletConnected ? 'Open workspace →' : 'Connect wallet →'}
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('how-it-works');
                  if (target) {
                    const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }}
                className="btn-secondary group flex items-center gap-2"
              >
                Product roadmap
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>

            {/* STATS */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRUST_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="neo-card bg-white p-4 text-center transition hover:scale-105 duration-300"
                >
                  <div className="text-2xl md:text-3xl font-black">{stat.value}</div>
                  <div className="text-xs font-bold uppercase text-neo-muted">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full flex justify-center">
            <img
              className="object-contain w-full max-w-5xl scale-[1.4] md:scale-150"
              src="./hero image (2).png"
              alt="PayPerAI Blockchain Gated AI Service Dashboard Preview illustrating pay-per-token billing with Pera Wallet integration"
            />
          </div>
        </div>
      </section>


      {/* LIVETICKER */}
      <div>
        <LiveTicker variant="light" />
      </div>


      {/* ABOUT — Two-column: Creative points left, YT Video right */}
      <Reveal>
        <section id="about" className="px-4 sm:px-5 py-24 md:px-8 bg-neo-cream border-t-[4px] border-black scroll-mt-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center">
              
              {/* LEFT: CONTENT & POINTS */}
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-1 font-black uppercase tracking-[0.2em] text-[10px] shadow-[2px_2px_0px_#000] mb-6">
                   MISSION REPORT
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[0.9]">
                  About PayPerAI
                </h2>
                

                <motion.div 
                  className="mt-10 flex flex-col gap-4"
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  {ABOUT_FEATURES.map((itemData, idx) => (
                    <motion.div
                      key={itemData.title}
                      className={`group neo-card bg-white p-4 flex items-start gap-4 transition hover:-translate-x-2 duration-300 ${idx % 2 !== 0 ? 'ml-0 lg:ml-6' : ''}`}
                      variants={item}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-[3px] border-black shadow-[3px_3px_0px_#000] transition-transform group-hover:rotate-6 ${
                        idx === 0 ? 'bg-[#b7f5c7]' : idx === 1 ? 'bg-[#9fc9ff]' : 'bg-[#fffde7]'
                      }`}>
                        <span className="text-2xl">{itemData.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{itemData.title}</h3>
                        <p className="mt-1 text-neo-muted font-semibold leading-snug text-sm">{itemData.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* RIGHT: VIDEO */}
              <div className="order-1 lg:order-2 flex flex-col justify-start w-full h-full mt-8 lg:mt-0 lg:pl-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
                  viewport={{ once: true }}
                  className="relative w-full aspect-video border-[4px] border-black bg-white shadow-[12px_12px_0px_#000] rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-[16px_16px_0px_#000] transition-all duration-300"
                >
                   <iframe 
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/wxWkeq6ea4A?si=LGrK6iG_M4s6TImq" 
                    title="PayPerAI Explainer Video"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure" 
                    allowFullScreen
                  ></iframe>
                </motion.div>

                {/* EXTRA CONTENT TO BALANCE COLUMN HEIGHT */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="mt-10 w-full border-[4px] border-black bg-[#e8f4fd] p-6 shadow-[8px_8px_0px_#000] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000] transition-all duration-300"
                >
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-xl font-black uppercase tracking-tight">Ready to test it?</h4>
                    <p className="mt-2 text-sm font-semibold text-neo-muted leading-relaxed">
                      Watch the demo, then jump straight into the decentralized workspace. Connect Pera Wallet to begin.
                    </p>
                  </div>
                  <button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="shrink-0 border-[3px] border-black bg-[#ffb3b3] px-6 py-3 font-black uppercase text-sm shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all whitespace-nowrap"
                  >
                    Start Now →
                  </button>
                </motion.div>
              </div>

            </div>
          </div>
        </section>
      </Reveal>




      {/* HOW IT WORKS + INFO PANEL */}
      <motion.section
        id="how-it-works"
        className="px-4 py-20 sm:px-6 md:px-8 scroll-mt-32"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-16 lg:grid-cols-2">

            {/* LEFT SIDE */}
            <div>
              <div className="inline-block border-[4px] border-black bg-neo-cream px-6 md:px-10 py-6 shadow-[10px_10px_0px_#000] -rotate-1 mb-8">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.9]">
                  Three steps.<br /> Zero SaaS drama.
                </h2>
              </div>

              <motion.div
                className="mt-8 flex flex-col gap-6"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {STEPS.map((step, index) => (
                  <motion.div
                    key={step.num}
                    className="grid grid-cols-[50px_1fr] gap-4"
                    variants={item}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Number + Line */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-[3px] border-black text-base font-black shadow-[3px_3px_0px_#000] bg-yellow-100">
                        {step.num}
                      </div>

                      {index !== STEPS.length - 1 && (
                        <div className="mt-2 h-full w-[4px] bg-black/20 rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="inline-block rounded-lg border-[3px] border-black bg-white px-3 py-1 shadow-[3px_3px_0px_#000]">
                        <h3 className="text-lg md:text-xl font-black uppercase">
                          {step.title}
                        </h3>
                      </div>

                      <div className="mt-3 rounded-lg border-[3px] border-black bg-[#f3f3f3] p-4 shadow-[4px_4px_0px_#000]">
                        <div className="mb-2 text-2xl">{step.icon}</div>

                        <p className="text-sm leading-relaxed font-semibold text-black/80">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT SIDE */}
            <div className="lg:pt-8">

              <div className="inline-block border-[4px] border-black bg-white px-8 py-4 shadow-[8px_8px_0px_#000] rotate-1 mb-6">
                <motion.h3
                  className="text-4xl md:text-5xl font-black tracking-tight"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  The Math
                </motion.h3>
              </div>

              <motion.div
                className="mt-10 rounded-lg border-[4px] border-black bg-[#f3f3f3] p-8 shadow-[8px_8px_0px_#000]"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <p className="text-lg italic font-semibold">
                  AI Request Flow
                </p>

                <div className="mt-5 border-b-[3px] border-black" />

                {/* ROW 1 */}
                <motion.div
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xl font-bold">
                      Choose AI Worker
                    </span>

                    <div className="rounded-lg border-[3px] border-black bg-[#b7f5c7] px-5 py-3 font-black shadow-[3px_3px_0px_#000]">
                      SELECT
                    </div>
                  </div>
                  <div className="mt-5 border-b-2 border-dashed border-black/30" />
                </motion.div>

                {/* ROW 2 */}
                <motion.div
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xl font-bold">
                      Request Verification
                    </span>

                    <div className="rounded-lg border-[3px] border-black bg-[#9fc9ff] px-5 py-3 font-black shadow-[3px_3px_0px_#000]">
                      usage weight
                    </div>
                  </div>
                  <div className="mt-5 border-b-2 border-dashed border-black/30" />
                </motion.div>

                {/* ROW 3 */}
                <motion.div
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-2xl font-bold">
                      Max Context Limit
                    </span>

                    <div className="rounded-lg border-[3px] border-black bg-[#ffb3b3] px-5 py-3 font-black shadow-[3px_3px_0px_#000]">
                      scaling cap x 10
                    </div>
                  </div>
                  <div className="mt-5 border-b-2 border-dashed border-black/30" />
                </motion.div>

              </motion.div>

              {/* WARNING */}
              <motion.div
                className="mt-8 flex items-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl">⚠</div>

                <p className="max-w-xl text-lg font-bold italic text-[#ff9fa8]">
                  Missed usage limits reduce system priority and may restrict future requests.
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </motion.section>


      {/* LIVE TICKER */}
      <div>
        <LiveTicker variant="dark" />
      </div>


      {/* SERVICES PREVIEW — two-column: models left, image right */}
      <section id="services-preview" className="px-4 sm:px-5 py-20 md:px-8 overflow-hidden scroll-mt-32">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="text-center mb-16">
            <div className="inline-block border-[4px] border-black bg-[#9fc9ff] px-8 py-4 shadow-[10px_10px_0px_#000] rotate-1 mb-6">
              <h2 className="text-3xl md:text-6xl font-black">AI micro-services</h2>
            </div>
            <p className="mt-4 text-lg font-semibold text-neo-muted">Powered by the world's best models. Billed per task.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center">

            {/* LEFT — Creative staggered model cards */}
            <div className="relative flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 border-[3px] border-black bg-[#b7f5c7] px-4 py-2 font-black uppercase tracking-widest text-sm shadow-[3px_3px_0px_#000] self-start mb-2">
                <span className="h-2 w-2 rounded-full bg-black" />
                Models we power
              </div>

              <motion.div initial={{ opacity: 0, x: -60, rotate: -4 }} whileInView={{ opacity: 1, x: 0, rotate: -2 }} transition={{ duration: 0.6, type: 'spring' }} viewport={{ once: true }} whileHover={{ rotate: 0, scale: 1.03 }} className="border-[4px] border-black bg-[#fffde7] shadow-[6px_6px_0px_#000] p-5 flex items-center gap-4 -rotate-2">
                <span className="text-4xl">🤖</span>
                <div>
                  <div className="text-2xl font-black tracking-tight">GPT-4o</div>
                  <div className="text-sm font-semibold text-neo-muted">OpenAI · Reasoning & Writing</div>
                </div>
                <div className="ml-auto border-[3px] border-black bg-[#b7f5c7] px-3 py-1 font-black text-xs shadow-[2px_2px_0px_#000]">LIVE</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -60, rotate: 3 }} whileInView={{ opacity: 1, x: 0, rotate: 2 }} transition={{ duration: 0.6, delay: 0.1, type: 'spring' }} viewport={{ once: true }} whileHover={{ rotate: 0, scale: 1.03 }} className="border-[4px] border-black bg-[#e8f4fd] shadow-[6px_6px_0px_#000] p-5 flex items-center gap-4 rotate-2 self-end w-[90%]">
                <span className="text-4xl">✨</span>
                <div>
                  <div className="text-2xl font-black tracking-tight">Gemini 1.5</div>
                  <div className="text-sm font-semibold text-neo-muted">Google · Vision & Analysis</div>
                </div>
                <div className="ml-auto border-[3px] border-black bg-[#9fc9ff] px-3 py-1 font-black text-xs shadow-[2px_2px_0px_#000]">LIVE</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -60, rotate: -2 }} whileInView={{ opacity: 1, x: 0, rotate: -1 }} transition={{ duration: 0.6, delay: 0.2, type: 'spring' }} viewport={{ once: true }} whileHover={{ rotate: 0, scale: 1.03 }} className="border-[4px] border-black bg-[#fce4ec] shadow-[6px_6px_0px_#000] p-5 flex items-center gap-4 -rotate-1">
                <span className="text-4xl">🦙</span>
                <div>
                  <div className="text-2xl font-black tracking-tight">Llama 3</div>
                  <div className="text-sm font-semibold text-neo-muted">Meta · Open-source Power</div>
                </div>
                <div className="ml-auto border-[3px] border-black bg-[#ffb3b3] px-3 py-1 font-black text-xs shadow-[2px_2px_0px_#000]">LIVE</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -60, rotate: 4 }} whileInView={{ opacity: 1, x: 0, rotate: 2 }} transition={{ duration: 0.6, delay: 0.3, type: 'spring' }} viewport={{ once: true }} whileHover={{ rotate: 0, scale: 1.03 }} className="border-[4px] border-black bg-white shadow-[6px_6px_0px_#000] p-5 flex items-center gap-4 rotate-2 self-end w-[85%]">
                <span className="text-4xl">🌐</span>
                <div>
                  <div className="text-2xl font-black tracking-tight">Qwen</div>
                  <div className="text-sm font-semibold text-neo-muted">Alibaba · Multilingual AI</div>
                </div>
                <div className="ml-auto border-[3px] border-black bg-[#b7f5c7] px-3 py-1 font-black text-xs shadow-[2px_2px_0px_#000]">LIVE</div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }} viewport={{ once: true }} className="border-[3px] border-dashed border-black/40 p-4 text-center font-black text-neo-muted text-sm tracking-widest">
                + More models coming soon
              </motion.div>
            </div>

            {/* RIGHT — Dashboard image */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, type: 'spring' }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >
              <img
                src="/services.png"
                alt="PayPerAI dynamic token-based billing and blockchain smart-session services dashboard preview"
                className="w-full h-auto object-contain scale-110 md:scale-125 transition-transform duration-500"
              />
            </motion.div>

          </div>
        </div>
      </section>


      {/* AI AGENT & CREATOR MARKETPLACE */}
      <Reveal>
        <section id="marketplace-preview" className="px-4 sm:px-5 py-12 md:px-8 bg-neo-cream scroll-mt-32 overflow-hidden">
          <div className="mx-auto max-w-7xl">
            
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="text-left">
                <div className="inline-block border-[4px] border-black bg-[#ffb3b3] px-8 py-4 shadow-[10px_10px_0px_#000]">
                  <h2 className="text-3xl md:text-6xl font-black tracking-tight">
                    AI Agent Marketplace
                  </h2>
                </div>
              </div>

              {/* RIGHT SIDE CTA BUTTONS */}
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <button
                  onClick={handleStartMakingAgents}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-[#fffde7] px-6 py-3 font-black uppercase text-sm md:text-base shadow-[5px_5px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[1px_1px_0px_#000] transition-all duration-150 cursor-pointer"
                >
                  Start Making Agents ⚙️
                </button>
                <button
                  onClick={handleExploreMarketplace}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-[#9fc9ff] px-6 py-3 font-black uppercase text-sm md:text-base shadow-[5px_5px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[1px_1px_0px_#000] transition-all duration-150 cursor-pointer"
                >
                  Explore Marketplace 🚀
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
              
              {/* LEFT: DECENTRALIZED MARKETPLACE SCREENSHOT */}
              <div className="w-full flex justify-center -mt-10 lg:-mt-16">
                <motion.img
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  src="/ai marketplace.png"
                  alt="PayPerAI decentralized custom AI agent marketplace creator dashboard"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>

              {/* RIGHT: INTERACTIVE VALUE PROP CARDS */}
              <div className="flex flex-col gap-6">
                
                {/* CARD 1: Build & Launch */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, rotate: 1, shadow: "8px 8px 0px #000" }}
                  className="neo-card bg-[#fffde7] p-6 border-[3px] border-black transition-all cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-[3px] border-black bg-[#b7f5c7] shadow-[3px_3px_0px_#000] text-black">
                      <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Build & Customize Agents</h3>
                      <p className="mt-2 text-neo-muted font-semibold leading-relaxed text-sm">
                        Create expert AI workers by defining custom names, models, and tailored system prompt instructions built for specific professional outcomes.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CARD 2: Revenue Splits */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, rotate: -1, shadow: "8px 8px 0px #000" }}
                  className="neo-card bg-[#b7f5c7] p-6 border-[3px] border-black transition-all cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-[3px] border-black bg-[#9fc9ff] shadow-[3px_3px_0px_#000] text-black">
                      <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Earn Custom Token Royalties</h3>
                      <p className="mt-2 text-neo-muted font-semibold leading-relaxed text-sm">
                        Monetize your expertise. Set custom execution royalty fees that split instantly on-chain between creators and the platform using Algorand smart contracts.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CARD 3: BYOK */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, rotate: 1, shadow: "8px 8px 0px #000" }}
                  className="neo-card bg-[#9fc9ff] p-6 border-[3px] border-black transition-all cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-[3px] border-black bg-[#ffb3b3] shadow-[3px_3px_0px_#000] text-black">
                      <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Secure BYOK Security</h3>
                      <p className="mt-2 text-neo-muted font-semibold leading-relaxed text-sm">
                        Bring Your Own Key (BYOK). Maintain absolute session keys control using a clean, client-side encrypted key manager that bypasses rate limits and quotas.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CARD 4: Portfolios */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, rotate: -1, shadow: "8px 8px 0px #000" }}
                  className="neo-card bg-[#fce4ec] p-6 border-[3px] border-black transition-all cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-[3px] border-black bg-[#fffde7] shadow-[3px_3px_0px_#000] text-black">
                      <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Decentralized Creator Profiles</h3>
                      <p className="mt-2 text-neo-muted font-semibold leading-relaxed text-sm">
                        Showcase your creation catalog in public profiles (<code className="bg-black/5 px-1.5 py-0.5 rounded font-mono font-bold">/creator/:wallet</code>) featuring live metrics and direct agent messaging.
                      </p>
                    </div>
                  </div>
                </motion.div>

              </div>

            </div>
          </div>
        </section>
      </Reveal>


      {/* FEATURES */}
      <section id="why-us" className="px-4 sm:px-5 pt-8 pb-20 md:px-8 scroll-mt-32">

        <div className="mx-auto max-w-7xl">

          {/* TITLE */}
          <h2 className="text-3xl md:text-6xl font-black">
            Trust signals that matter
          </h2>

          {/* GRID */}
          <motion.div
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                className="neo-card bg-white p-6 transition"
                variants={item}
                whileHover={{
                  scale: 1.05,
                  rotate: 0,
                  boxShadow: "6px 6px 0px #000",
                }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="text-2xl">{f.icon}</div>

                <h3 className="mt-3 text-xl font-black">
                  {f.title}
                </h3>

                <p className="mt-2 text-neo-muted">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>


      {/* LIVETICKER */}
      <div>
        <LiveTicker variant="light" />
      </div>




      {/* NEW CTA SECTION */}
      <section id="join-us" className="px-4 sm:px-5 py-24 md:py-32 md:px-8 overflow-hidden scroll-mt-32">
        <div className="mx-auto max-w-4xl flex flex-col items-center justify-center gap-10 md:gap-14">

          {/* JOIN NOW */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -6 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.6, type: 'spring' }}
            viewport={{ once: true }}
            className="w-full sm:w-[80%] bg-[#b7f5c7] border-[4px] border-black shadow-[8px_8px_0px_#000] p-6 md:p-8 transform -rotate-2 text-center"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-widest uppercase text-black">
              Join Now.
            </h2>
          </motion.div>

          {/* Middle Text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white border-[3px] border-black px-6 py-8 md:px-12 md:py-10 transform rotate-1 text-center max-w-2xl w-full"
          >
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-black">
              No subscriptions. No friction.<br />
              Just secure, machine-to-machine payments.
            </p>
          </motion.div>

          {/* CONNECT WALLET BUTTON */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full sm:w-[80%] bg-[#9fc9ff] border-[4px] border-black shadow-[8px_8px_0px_#000] p-6 md:p-8 text-center transition-all duration-150 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_#000] active:translate-x-2 active:translate-y-2 active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="text-3xl md:text-5xl lg:text-6xl font-black tracking-widest uppercase text-black">
              {isConnecting ? 'Connecting...' : isWalletConnected ? 'Open Workspace' : 'Connect Wallet'}
            </span>
          </motion.button>

        </div>
      </section>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#fff7df]/80 backdrop-blur-sm" />
          <div className="animate-fadeUp relative w-full max-w-md rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
            <h2 className="mb-2 text-2xl font-black text-black">Complete Profile</h2>
            <p className="mb-6 text-sm font-bold opacity-60 text-black">Please provide your details to continue.</p>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-black text-black">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={onboardingData.name}
                  onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                  className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111] bg-white text-black"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-black text-black">Email</label>
                <input 
                  required 
                  type="email" 
                  value={onboardingData.email}
                  onChange={e => setOnboardingData({...onboardingData, email: e.target.value})}
                  className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111] bg-white text-black"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-black text-black">Date of Birth</label>
                <input 
                  required 
                  type="date" 
                  value={onboardingData.dob}
                  onChange={e => setOnboardingData({...onboardingData, dob: e.target.value})}
                  className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111] bg-white text-black"
                />
              </div>
              <button 
                disabled={isRegistering}
                type="submit"
                className="w-full rounded-xl border-2 border-[#111] bg-[#b7f5c7] py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 text-black cursor-pointer"
              >
                {isRegistering ? 'Registering...' : 'Register Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;