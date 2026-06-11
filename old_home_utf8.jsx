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
import { motion, AnimatePresence } from "framer-motion";

const ROTATING_WORDS = ["trap.", "lock-in.", "friction.", "fees."];

const RotatingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex flex-col h-[1.1em] overflow-hidden align-bottom text-foreground/80 font-normal ml-3">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="whitespace-nowrap"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Top-class abstract high-tech animation for the Hero section
const AbstractHeroAnimation = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-[1500px] opacity-[0.9]">
      <motion.div 
        className="relative w-[360px] h-[360px]"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateX: [0, 360], 
          rotateY: [0, 360],
          rotateZ: [0, 360]
        }}
        transition={{ 
          duration: 50, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {/* Main large cube with internal grid */}
        {[
          { rotateY: 0, translateZ: 180 },
          { rotateY: 90, translateZ: 180 },
          { rotateY: 180, translateZ: 180 },
          { rotateY: -90, translateZ: 180 },
          { rotateX: 90, translateZ: 180 },
          { rotateX: -90, translateZ: 180 }
        ].map((face, i) => (
          <div
            key={i}
            className="absolute inset-0 border border-foreground/30 bg-background/5 backdrop-blur-[2px]"
            style={{
              transform: `rotateX(${face.rotateX || 0}deg) rotateY(${face.rotateY || 0}deg) translateZ(${face.translateZ}px)`,
            }}
          >
            {/* Elegant 4x4 inner grid on each face */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
               {Array.from({length: 16}).map((_, j) => (
                 <div key={j} className="border border-foreground/10" />
               ))}
            </div>
          </div>
        ))}
        
        {/* Inner floating core cube */}
        {[
          { rotateY: 0, translateZ: 80 },
          { rotateY: 90, translateZ: 80 },
          { rotateY: 180, translateZ: 80 },
          { rotateY: -90, translateZ: 80 },
          { rotateX: 90, translateZ: 80 },
          { rotateX: -90, translateZ: 80 }
        ].map((face, i) => (
          <div
            key={`core-${i}`}
            className="absolute inset-0 m-auto w-[160px] h-[160px] border border-foreground/50 bg-foreground/5 backdrop-blur-sm"
            style={{
              transform: `rotateX(${face.rotateX || 0}deg) rotateY(${face.rotateY || 0}deg) translateZ(${face.translateZ}px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};


const STEPS = [
  { num: 'I', title: 'Connect your wallet', desc: 'Link your Pera Wallet in seconds. Authorize a tiny ALGO allowance ΓÇö no subscription, no surprise renewal.', icon: '≡ƒÄ»' },
  { num: 'II', title: 'Pick an AI worker', desc: 'Choose the AI service you need for one task: code, analysis, writing, support, or content generation.', icon: '≡ƒ¢í∩╕Å' },
  { num: 'III', title: 'Ship to production', desc: 'Get your result with on-chain verification proof. Every paid usage is auditable and transparent.', icon: 'ΓÜí' },
];

const FEATURES = [
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, 
    title: 'On-chain proof of usage', 
    desc: 'Each paid action is tied to Algorand verification, making spend easier to audit.' 
  },
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
    title: 'True pay-per-use pricing', 
    desc: 'A practical fit for SMEs, colleges, agencies, and teams that cannot justify monthly AI seats.' 
  },
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, 
    title: 'Wallet-first access', 
    desc: 'Reduce account friction while keeping payment consent explicit through Pera Wallet.' 
  },
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, 
    title: 'Usage dashboard', 
    desc: 'Track balance, sessions, history, and analytics from one focused workspace.' 
  },
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, 
    title: 'Task-specific AI workers', 
    desc: 'Services are packaged around real outcomes instead of a blank generic chatbot.' 
  },
  { 
    icon: <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, 
    title: 'Enterprise-ready transparency', 
    desc: 'Clear pricing, transaction proof, and explainable flow help build industry trust.' 
  },
];

const ABOUT_FEATURES = [
  {
    num: "01",
    title: "Instant Deployment",
    desc: "Push to production in seconds. Our edge network ensures your applications load instantly, anywhere in the world.",
    icon: (
      <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <path d="M6 8h12M6 12h12M6 16h8" />
        <circle cx="12" cy="23" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    num: "02",
    title: "AI-Native Workflows",
    desc: "Build intelligent applications with built-in AI capabilities. From inference to training, everything scales automatically.",
    icon: (
      <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="4" r="1.5" />
        <circle cx="12" cy="20" r="1.5" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
        <circle cx="6.5" cy="6.5" r="1.5" />
        <circle cx="17.5" cy="17.5" r="1.5" />
        <path d="M12 7v2M12 15v2M7 12h2M15 12h2M8 8l1.5 1.5M14.5 14.5l1.5 1.5" />
      </svg>
    )
  },
  {
    num: "03",
    title: "Usage-Based Billing",
    desc: "Pay only for the exact AI tokens you consume instead of expensive monthly subscriptions.",
    icon: (
      <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    )
  },
  {
    num: "04",
    title: "Future AI Economy",
    desc: "A decentralized infrastructure for AI orchestration, NFT ownership, and wallet-native intelligence systems.",
    icon: (
      <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <polyline points="12 22 12 12" />
        <polyline points="22 8.5 12 12 2 8.5" />
      </svg>
    )
  },
];

const TRUST_STATS = [
  { value: '0', label: 'monthly lock-in' },
  { value: '$0.001', label: 'per completion' },
  { value: '$0.002', label: 'per reasoning task' },
  { value: '$0.05', label: 'per complex generation' },
];

const AI_MODELS = [
  { 
    name: 'GPT-4o Mini', 
    provider: 'OpenAI ┬╖ Reasoning & Writing', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2057 5.9847 5.9847 0 0 0 3.989-2.9 6.051 6.051 0 0 0-.7388-7.0732zM13.2599 22.3995c-2.0366 0-3.8966-1.1294-4.8217-2.9038l6.8184-3.9213V8.7188l3.6662 2.1121v6.9242c0 2.5532-2.0838 4.6444-4.6629 4.6444zm-9.3908-4.7088a4.4265 4.4265 0 0 1-1.3533-3.0483c0-2.4348 1.9056-4.4243 4.2575-4.5772l-.0048 7.8447 3.6663-2.1121v-4.2289L5.334 16.5935a4.4624 4.4624 0 0 1-1.4649 1.0972zm11.2335-5.3402-4.148-2.3891-4.148 2.3891v4.7781l4.148 2.389 4.148-2.389v-4.7781zM3.486 9.4187c.224-2.524 2.368-4.4338 4.9142-4.4338.4872 0 .9615.068 1.4143.1953L3.0003 9.1025v4.224l3.6662 2.112v-6.9242l-2.457-1.414a4.453 4.453 0 0 1-.7235 2.3184zm16.1558 3.064c0 2.4349-1.9056 4.4243-4.2575 4.5771l.0048-7.8446-3.6663 2.112v4.2288l5.1008-2.9436c.5533-.3182.993-.7871 1.2828-1.3444a4.4426 4.4426 0 0 0 .1819-3.0484V12.4827zM20.514 14.5813c-.224 2.524-2.368 4.4338-4.9142 4.4338-.4872 0-.9615-.068-1.4143-.1953l6.8142-3.9223v-4.224l-3.6662-2.112v6.9242l2.457 1.414c.2818.163.5358.3752.7538.6288v.373a4.453 4.453 0 0 0 .7235-2.3184v-.2318zM10.7401 1.6005c2.0366 0 3.8966 1.1294 4.8217 2.9038l-6.8184 3.9213v6.8556L5.0772 13.1691V6.2449C5.0772 3.6917 7.161 1.6005 10.7401 1.6005z"/></svg>,
    tag: 'MOST POPULAR',
    desc: 'Fast and intelligent multi-purpose assistant from OpenAI.',
    usdInput: '$0.45',
    usdOutput: '$1.80',
    algoInput: '1.30 ALGO',
    algoOutput: '5.20 ALGO',
    features: ['High reasoning capability', '128k context window', 'Vision support', 'Ideal for coding']
  },
  { 
    name: 'Gemini 1.5 Flash', 
    provider: 'Google ┬╖ Vision & Analysis', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"/></svg>,
    desc: "Google's lightweight, fast, and highly capable multimodal model.",
    usdInput: '$0.22',
    usdOutput: '$0.90',
    algoInput: '0.35 ALGO',
    algoOutput: '1.40 ALGO',
    features: ['2M context window', 'Native multimodal', 'Fast processing', 'Data analysis']
  },
  { 
    name: 'Llama 3.3', 
    provider: 'Meta/Groq ┬╖ Open-source Power', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M21.996 9.878v4.22l-6.824 3.93-3.176-1.83-6.824 3.93v-4.22l6.824-3.93 3.176 1.83 6.824-3.93zM21.996 4.945v4.22l-6.824 3.93-3.176-1.83-6.824 3.93V4.945L12 1.01l9.996 3.935zM12 22.99l-9.996-3.935V14.83L12 18.76l9.996-3.93v4.225L12 22.99z"/></svg>,
    desc: 'Lightning-fast general purpose reasoning model powered by Groq.',
    usdInput: '$1.77',
    usdOutput: '$2.37',
    algoInput: '0.95 ALGO',
    algoOutput: '2.80 ALGO',
    features: ['Open-source weights', 'Low latency via Groq', 'High efficiency', 'General text generation']
  },
  { 
    name: 'Qwen 2.5', 
    provider: 'Alibaba ┬╖ Multilingual AI', 
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2zM2 12h20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>,
    desc: 'Powerful open-weights model capable of deep technical insights.',
    usdInput: '$1.20',
    usdOutput: '$1.20',
    algoInput: '2.60 ALGO',
    algoOutput: '5.50 ALGO',
    features: ['Strong multilingual', 'Cost-effective', 'Coding support', 'Deep insights']
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};


const Home = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({ name: '', dob: '', email: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeModelIndex, setActiveModelIndex] = useState(0);
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
    setConnectStatus('Connecting to Pera...');
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
      
      setConnectStatus('Getting challenge...');
      const { nonce } = await getNonce(addr);
      const message = `PayPerUseAI Sign-In\nWallet: ${addr}\nNonce: ${nonce}`;
      const msgBytes = new TextEncoder().encode(message);
      
      setConnectStatus('Please sign in wallet...');
      const signedData = await peraWallet.signData([{ data: msgBytes, message }], addr);
      
      setConnectStatus('Verifying...');
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
      setConnectStatus('');
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
      className={`overflow-x-hidden bg-background text-foreground transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ HERO ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section className="relative min-h-screen px-6 pt-32 pb-20 md:px-8 flex items-center">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: `
            linear-gradient(rgba(10,10,10,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,10,10,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(circle at 70% 30%, black 20%, transparent 70%)'
        }} />

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl"
          >
            {/* Category label */}
            <motion.div variants={staggerItem} className="section-label mb-8">
              The pay-per-use AI platform
            </motion.div>

            {/* Main heading */}
            <motion.h1 variants={staggerItem} className="text-5xl md:text-7xl lg:text-[6.2rem] font-medium leading-[0.95] tracking-[-0.04em] text-foreground mb-8">
              Industrial AI
              <br />
              without the
              <br />
              subscription
              <RotatingText />
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={staggerItem} className="max-w-xl text-lg md:text-xl font-normal text-muted leading-relaxed">
              Your toolkit to stop overpaying and start innovating.
              Securely connect, pay per task, and scale the best AI models.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-primary text-base !px-8 !py-4"
              >
                {isConnecting ? (connectStatus || 'Connecting...') : 'Start free trial'}
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('join-us');
                  if (target) {
                    const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }}
                className="btn-secondary text-base !px-8 !py-4 bg-transparent border border-black/10 shadow-none text-foreground hover:bg-black/5"
              >
                Watch demo
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Abstract Animation ΓÇö right side on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="absolute top-0 right-[-5%] bottom-0 w-[55%] hidden lg:flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-[120%] -top-[10%] [mask-image:linear-gradient(to_left,black_20%,transparent_100%)] pointer-events-none">
              <AbstractHeroAnimation />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ STATS TICKER ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <LiveTicker />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ ABOUT / FEATURES ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="about" className="px-6 py-24 md:px-8 bg-foreground/[0.01] scroll-mt-32 border-y border-foreground/[0.03]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="mb-20"
          >
            <motion.div variants={staggerItem} className="section-label mb-8">
              Capabilities
            </motion.div>

            <motion.h2 variants={staggerItem} className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              Everything you need.
              <br />
              <span className="text-muted/60 font-medium">Nothing you don't.</span>
            </motion.h2>
          </motion.div>

          {/* Feature list ΓÇö Minimalist layout */}
          <motion.div
            className="flex flex-col border-t border-foreground/[0.08]"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {ABOUT_FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="py-16 border-b border-foreground/[0.08] flex flex-col md:flex-row items-start justify-between gap-12 group hover:bg-foreground/[0.02] transition-colors -mx-8 px-8"
                variants={staggerItem}
              >
                <div className="flex items-start gap-8 max-w-2xl">
                  <span className="text-sm font-semibold tracking-wider text-muted mt-1.5 shrink-0 uppercase">{feature.num}</span>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-base md:text-lg text-muted leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex shrink-0 opacity-40 group-hover:opacity-100 text-foreground transition-opacity duration-500">
                  {feature.icon}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ HOW IT WORKS (DARK) ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section
        id="how-it-works"
        className="px-6 py-16 md:px-8 bg-[#0a0a0a] text-white scroll-mt-32 relative overflow-hidden"
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg" />

        {/* Subtle blue glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/[0.04] rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-2 items-start">

            {/* LEFT SIDE */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem} className="section-label mb-6 !text-white/40 before:!bg-white/20">
                Process
              </motion.div>

              <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
                Three steps.
                <br />
                <span className="text-white/30">Zero SaaS drama.</span>
              </motion.h2>

              {/* Interactive step selector */}
              <div className="mt-14 flex flex-col">
                {STEPS.map((step, index) => (
                  <motion.button
                    key={step.num}
                    variants={staggerItem}
                    className={`text-left py-7 border-b border-white/[0.06] transition-all duration-300 group cursor-pointer ${
                      activeStep === index ? '' : 'opacity-40 hover:opacity-70'
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-sm font-normal mt-1 transition-colors ${
                        activeStep === index ? 'text-white/60' : 'text-white/30'
                      }`}>
                        {step.num}
                      </span>
                      <div>
                        <h3 className="text-xl md:text-2xl font-medium tracking-[-0.02em]">
                          {step.title}
                        </h3>
                        {activeStep === index && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-2 text-sm text-white/50 leading-relaxed max-w-md"
                          >
                            {step.desc}
                          </motion.p>
                        )}
                      </div>
                    </div>
                    {/* Animated progress bar */}
                    {activeStep === index && (
                      <motion.div
                        className="mt-4 h-[2px] bg-white/20 rounded-full ml-8"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT SIDE ΓÇö Terminal card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:pt-20"
            >
              <div className="terminal-card p-6 md:p-8">
                {/* Terminal dots */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                  </div>
                  <span className="text-xs text-white/30 font-mono">workflow.ts</span>
                </div>

                {/* Code content */}
                <div className="font-mono text-sm leading-relaxed">
                  <div className="flex">
                    <span className="text-white/20 w-8 shrink-0 select-none">1</span>
                    <span><span className="text-blue-400">PayPerUseAI</span>.deploy({'{'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-white/20 w-8 shrink-0 select-none">2</span>
                    <span className="text-white/60 ml-4">model: <span className="text-green-400">'gpt-4o'</span>,</span>
                  </div>
                  <div className="flex">
                    <span className="text-white/20 w-8 shrink-0 select-none">3</span>
                    <span className="text-white/60 ml-4">billing: <span className="text-green-400">'per-token'</span>,</span>
                  </div>
                  <div className="flex">
                    <span className="text-white/20 w-8 shrink-0 select-none">4</span>
                    <span className="text-white/60 ml-4">chain: <span className="text-green-400">'algorand'</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-white/20 w-8 shrink-0 select-none">5</span>
                    <span>{'}'})</span>
                  </div>
                  <div className="flex mt-2">
                    <span className="text-white/20 w-8 shrink-0 select-none">6</span>
                    <span className="text-white/30">{'// Verified on-chain Γ£ô'}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-white/40">Ready</span>
                </div>
              </div>

              {/* Warning note */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                viewport={{ once: true }}
                className="mt-6 flex items-start gap-3 text-white/30"
              >
                <span className="text-lg mt-0.5">ΓÜá</span>
                <p className="text-sm leading-relaxed">
                  Missed usage limits reduce system priority and may restrict future requests.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ SERVICES ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="services-preview" className="px-6 py-16 md:px-8 scroll-mt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* LEFT ΓÇö Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              <motion.div variants={staggerItem} className="section-label mb-6">
                For users
              </motion.div>

              <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
                AI micro-
                <br />
                <span className="text-muted">services.</span>
              </motion.h2>

              <motion.p variants={staggerItem} className="mt-6 text-base text-muted leading-relaxed max-w-md">
                Powered by the world's best models. Billed per task. Switch seamlessly without losing context.
              </motion.p>

              {/* Model list */}
              <motion.div
                className="mt-10 flex flex-col"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {AI_MODELS.map((model, idx) => (
                  <motion.button
                    key={model.name}
                    onClick={() => setActiveModelIndex(idx)}
                    variants={staggerItem}
                    className={`flex items-center gap-4 py-5 w-full text-left transition-all duration-300 ${
                      idx !== AI_MODELS.length - 1 ? 'border-b border-foreground/[0.06]' : ''
                    } ${activeModelIndex === idx ? 'pl-4 border-l-4 border-l-foreground' : 'hover:pl-2'}`}
                  >
                    <span className={`text-foreground transition-opacity ${activeModelIndex === idx ? 'opacity-100' : 'opacity-40'}`}>
                      {model.icon}
                    </span>
                    <div className="flex-1">
                      <h4 className={`text-lg font-medium transition-colors ${activeModelIndex === idx ? 'text-foreground' : 'text-muted'}`}>{model.name}</h4>
                      <p className="text-sm text-muted/70">{model.provider}</p>
                    </div>
                    {model.tag ? (
                      <span className="text-[10px] font-medium uppercase tracking-[0.15em] bg-foreground text-background rounded-full px-3 py-1">
                        {model.tag}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-green-600 border border-green-600/20 rounded-full px-3 py-1">
                        Live
                      </span>
                    )}
                  </motion.button>
                ))}

                <motion.div
                  variants={staggerItem}
                  className="py-4 text-sm text-muted text-center border border-dashed border-foreground/10 rounded-xl mt-4"
                >
                  + More models coming soon
                </motion.div>
              </motion.div>
            </motion.div>

            {/* RIGHT ΓÇö Dynamic Pricing Card */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="flex items-center justify-center lg:pt-20 relative"
            >
              <motion.div 
                key={activeModelIndex}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[360px] bg-transparent rounded-[1.5rem] p-8 border border-black/10"
              >
                <div className="text-sm font-medium text-black/40 tracking-[0.2em] uppercase mb-4">
                  0{activeModelIndex + 1}
                </div>
                <h3 className="text-3xl font-semibold text-black tracking-tight mb-3">
                  {AI_MODELS[activeModelIndex].name.replace(' Mini', '').replace(' Flash', '')}
                </h3>
                <p className="text-sm text-black/60 leading-relaxed mb-6">
                  {AI_MODELS[activeModelIndex].desc}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-[11px] font-bold text-black/40 tracking-wider uppercase mb-1">Input (1M Tokens)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[2rem] font-bold tracking-tighter text-black leading-none">
                        {AI_MODELS[activeModelIndex].usdInput}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-black/50 mt-1">
                      {AI_MODELS[activeModelIndex].algoInput}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-black/40 tracking-wider uppercase mb-1">Output (1M Tokens)</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[2rem] font-bold tracking-tighter text-black leading-none">
                        {AI_MODELS[activeModelIndex].usdOutput}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-black/50 mt-1">
                      {AI_MODELS[activeModelIndex].algoOutput}
                    </div>
                  </div>
                </div>
                
                <hr className="border-black/5 mb-6" />
                
                <div className="space-y-3 mb-8">
                  {AI_MODELS[activeModelIndex].features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-black/80">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button onClick={(e) => { e.preventDefault(); document.getElementById('join-us')?.scrollIntoView({behavior: 'smooth'})}} className="w-full bg-black text-white rounded-full py-3.5 text-sm font-medium hover:bg-black/90 transition-colors flex items-center justify-center gap-2">
                  Start using <span className="ml-1">ΓåÆ</span>
                </button>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ STATS TICKER 2 ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <LiveTicker />


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ MARKETPLACE ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="marketplace-preview" className="px-6 py-10 md:py-12 md:px-8 scroll-mt-32">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14"
          >
            <div>
              <motion.div variants={staggerItem} className="section-label mb-6">
                Ecosystem
              </motion.div>
              <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
                AI Agent
                <br />
                <span className="text-muted">Marketplace.</span>
              </motion.h2>
            </div>

            <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartMakingAgents}
                className="btn-primary text-sm !px-6 !py-2.5"
              >
                Start Making Agents
              </button>
              <button
                onClick={handleExploreMarketplace}
                className="btn-secondary text-sm !px-6 !py-2.5"
              >
                Explore Marketplace
              </button>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* LEFT: Marketplace screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="w-full flex items-center justify-center lg:-mt-12"
            >
              <img
                src="/ai marketplace.png"
                alt="PayPerUseAI decentralized custom AI agent marketplace creator dashboard"
                className="w-[80%] max-w-[420px] h-auto object-contain drop-shadow-xl"
              />
            </motion.div>

            {/* RIGHT: Value prop cards */}
            <motion.div
              className="flex flex-col gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  title: 'Build & Customize Agents',
                  desc: 'Create expert AI workers by defining custom names, models, and tailored system prompt instructions built for specific professional outcomes.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  ),
                },
                {
                  title: 'Earn Token Royalties',
                  desc: 'Monetize your expertise. Set custom execution royalty fees that split instantly on-chain between creators and the platform.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  title: 'Secure BYOK Security',
                  desc: 'Bring Your Own Key. Maintain absolute session key control using a clean, client-side encrypted key manager.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  ),
                },
                {
                  title: 'Creator Profiles',
                  desc: 'Showcase your catalog in public profiles featuring live metrics and direct agent messaging.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                  ),
                },
              ].map((card, idx) => (
                <motion.div
                  key={card.title}
                  variants={staggerItem}
                  className="clean-card p-6 group cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 group-hover:bg-foreground/[0.08] transition-colors">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-foreground">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ FEATURES / TRUST SIGNALS ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="why-us" className="px-6 py-16 md:px-8 scroll-mt-32">
        <div className="mx-auto max-w-7xl">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="section-label mb-6">
              Why us
            </motion.div>

            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95] mb-14">
              Trust signals
              <br />
              <span className="text-muted">that matter.</span>
            </motion.h2>
          </motion.div>

          {/* Stats Grid ΓÇö Optimus style */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="stats-grid grid-cols-2 md:grid-cols-4 mb-16"
          >
            {TRUST_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="mt-4 text-base font-medium uppercase tracking-[0.05em] text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                className="clean-card p-6 group cursor-default"
                variants={staggerItem}
              >
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-base font-medium text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ FINAL CTA ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <section id="join-us" className="px-6 py-16 md:py-24 md:px-8 scroll-mt-32">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-foreground/10 bg-background flex flex-col md:flex-row relative"
          >
            <div className="p-10 md:p-16 lg:p-20 flex-1 z-10 flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-[1.05] text-foreground mb-6">
                Ready to build<br />something great?
              </h2>
              <p className="text-lg text-muted/80 max-w-md leading-relaxed mb-10">
                Join thousands of teams shipping faster with PayPerUseAI. Start free, scale infinitely.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full sm:w-auto bg-black text-white px-8 py-3.5 rounded-full text-sm font-medium flex items-center justify-center hover:bg-black/90 transition-colors"
                >
                  {isConnecting ? (connectStatus || 'Connecting...') : 'Start building free'}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={() => window.open('mailto:sales@PayPerUseAI.com')}
                  className="w-full sm:w-auto bg-background text-foreground border border-foreground/10 px-8 py-3.5 rounded-full text-sm font-medium flex items-center justify-center hover:bg-foreground/5 transition-colors"
                >
                  Talk to sales
                </button>
              </div>
              
              <p className="text-xs text-muted/60 font-mono tracking-wider">
                Connect Pera Wallet ┬╖ Pay per task
              </p>
            </div>
            
            {/* Video Graphic Right Side */}
            <div className="flex-1 bg-background hidden md:flex items-center justify-center relative border-l border-foreground/10">
              <iframe
                className="absolute inset-0 w-full h-full object-cover"
                src="https://www.youtube.com/embed/wxWkeq6ea4A?si=qIIFOSd3nooruOPk&rel=0"
                title="PayPerUseAI Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ ONBOARDING MODAL ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="animate-fade-in relative w-full max-w-md rounded-2xl border border-foreground/10 bg-white p-8 shadow-card-hover">
            <h2 className="mb-1 text-xl font-semibold text-foreground">Complete Profile</h2>
            <p className="mb-6 text-sm text-muted">Please provide your details to continue.</p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  required
                  type="text"
                  value={onboardingData.name}
                  onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                  className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  required
                  type="email"
                  value={onboardingData.email}
                  onChange={e => setOnboardingData({...onboardingData, email: e.target.value})}
                  className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Date of Birth</label>
                <input
                  required
                  type="date"
                  value={onboardingData.dob}
                  onChange={e => setOnboardingData({...onboardingData, dob: e.target.value})}
                  className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5"
                />
              </div>
              <button
                disabled={isRegistering}
                type="submit"
                className="w-full btn-primary !py-3 disabled:opacity-50"
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
