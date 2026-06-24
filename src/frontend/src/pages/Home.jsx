import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & DATA
   ═══════════════════════════════════════════════════════════════ */

const ROTATING_WORDS = ["trap.", "lock-in.", "friction.", "fees."];

const STEPS = [
  { num: 'I', title: 'Connect your wallet', desc: 'Link your Pera Wallet in seconds. Authorize a tiny ALGO allowance — no subscription, no surprise renewal.', icon: '🎯' },
  { num: 'II', title: 'Pick an AI worker', desc: 'Choose the AI service you need for one task: code, analysis, writing, support, or content generation.', icon: '🛡️' },
  { num: 'III', title: 'Ship to production', desc: 'Get your result with on-chain verification proof. Every paid usage is auditable and transparent.', icon: '⚡' },
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
      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <path d="M6 8h12M6 12h12M6 16h8" />
      </svg>
    )
  },
  {
    num: "02",
    title: "AI-Native Workflows",
    desc: "Build intelligent applications with built-in AI capabilities. From inference to training, everything scales automatically.",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="4" r="1.5" />
        <circle cx="12" cy="20" r="1.5" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
        <path d="M12 7v2M12 15v2M7 12h2M15 12h2" />
      </svg>
    )
  },
  {
    num: "03",
    title: "Usage-Based Billing",
    desc: "Pay only for the exact AI tokens you consume instead of expensive monthly subscriptions.",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    )
  },
  {
    num: "04",
    title: "Future AI Economy",
    desc: "A decentralized infrastructure for AI orchestration, NFT ownership, and wallet-native intelligence systems.",
    icon: (
      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <polyline points="12 22 12 12" />
        <polyline points="22 8.5 12 12 2 8.5" />
      </svg>
    )
  },
];

const TRUST_STATS = [
  { value: '$0', label: 'monthly lock-in', prefix: '' },
  { value: '$0.001', label: 'per completion', prefix: '' },
  { value: '$0.002', label: 'per reasoning task', prefix: '' },
  { value: '$0.05', label: 'per complex generation', prefix: '' },
];

const AI_MODELS = [
  {
    name: 'GPT-4o Mini',
    provider: 'OpenAI · Reasoning & Writing',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2057 5.9847 5.9847 0 0 0 3.989-2.9 6.051 6.051 0 0 0-.7388-7.0732z"/></svg>,
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
    provider: 'Google · Vision & Analysis',
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
    provider: 'Meta/Groq · Open-source Power',
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
    provider: 'Alibaba · Multilingual AI',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2zM2 12h20" stroke="currentColor" strokeWidth="2" fill="none"/></svg>,
    desc: 'Powerful open-weights model capable of deep technical insights.',
    usdInput: '$1.20',
    usdOutput: '$1.20',
    algoInput: '2.60 ALGO',
    algoOutput: '5.50 ALGO',
    features: ['Strong multilingual', 'Cost-effective', 'Coding support', 'Deep insights']
  },
];

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

// ─── Rotating Text ───
const RotatingText = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex flex-col h-[1.1em] overflow-hidden align-bottom ml-3">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="whitespace-nowrap text-gradient"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// ─── Animated Counter ───
const AnimatedCounter = ({ value, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [displayed, setDisplayed] = useState(prefix + '0' + suffix);

  useEffect(() => {
    if (!inView) return;
    // Just animate in the final value with a delay
    const timer = setTimeout(() => setDisplayed(prefix + value + suffix), 200);
    return () => clearTimeout(timer);
  }, [inView, value, suffix, prefix]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {displayed}
    </motion.span>
  );
};

// ─── Abstract Cube Animation (Restored) ───
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



// ─── Orbiting Ring System (Hero Animation) ───
const OrbitingRings = () => {
  return (
    <div className="relative w-[400px] h-[400px] flex items-center justify-center">
      {/* Central core */}
      <div className="absolute w-3 h-3 rounded-full bg-foreground/30" />
      <div className="absolute w-6 h-6 rounded-full border border-foreground/10 animate-pulse-ring" />

      {/* Ring 1 - Inner */}
      <div className="absolute w-[160px] h-[160px] rounded-full border border-foreground/[0.08]" style={{ transform: 'rotateX(70deg)' }}>
        <div
          className="absolute w-2.5 h-2.5 rounded-full bg-accent/60"
          style={{ '--orbit-radius': '80px', '--orbit-duration': '8s', animation: 'orbit 8s linear infinite', top: '50%', left: '50%', marginTop: '-5px', marginLeft: '-5px' }}
        />
      </div>

      {/* Ring 2 - Middle */}
      <div className="absolute w-[260px] h-[260px] rounded-full border border-foreground/[0.06]" style={{ transform: 'rotateX(70deg) rotateZ(30deg)' }}>
        <div
          className="absolute w-2 h-2 rounded-full bg-foreground/40"
          style={{ '--orbit-radius': '130px', '--orbit-duration': '14s', animation: 'orbit 14s linear infinite', top: '50%', left: '50%', marginTop: '-4px', marginLeft: '-4px' }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-accent/40"
          style={{ '--orbit-radius': '130px', '--orbit-duration': '14s', animation: 'orbit-reverse 14s linear infinite', top: '50%', left: '50%', marginTop: '-3px', marginLeft: '-3px' }}
        />
      </div>

      {/* Ring 3 - Outer */}
      <div className="absolute w-[360px] h-[360px] rounded-full border border-foreground/[0.04]" style={{ transform: 'rotateX(70deg) rotateZ(-15deg)' }}>
        <div
          className="absolute w-2 h-2 rounded-full bg-foreground/25"
          style={{ '--orbit-radius': '180px', '--orbit-duration': '22s', animation: 'orbit 22s linear infinite', top: '50%', left: '50%', marginTop: '-4px', marginLeft: '-4px' }}
        />
      </div>

      {/* Vertical ring */}
      <div className="absolute w-[220px] h-[220px] rounded-full border border-foreground/[0.05]" style={{ transform: 'rotateY(70deg) rotateZ(45deg)' }}>
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-accent/50"
          style={{ '--orbit-radius': '110px', '--orbit-duration': '18s', animation: 'orbit-reverse 18s linear infinite', top: '50%', left: '50%', marginTop: '-3px', marginLeft: '-3px' }}
        />
      </div>

      {/* Ambient glow */}
      <div className="absolute w-32 h-32 rounded-full bg-accent/[0.04] blur-3xl" />
    </div>
  );
};

// ─── Dot Grid Background ───
const DotGridBg = () => {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      setOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-[-20px] dot-grid opacity-40 transition-transform duration-[2000ms] ease-out"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          maskImage: 'radial-gradient(ellipse at 60% 40%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 60% 40%, black 20%, transparent 70%)'
        }}
      />
      {/* Aurora blob */}
      <motion.div
        className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(139,115,85,0.08) 0%, transparent 70%)'
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(10,10,10,0.05) 0%, transparent 70%)'
        }}
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 30, -10, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

// ─── Terminal with Typing Effect ───
const TerminalCard = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [visibleLines, setVisibleLines] = useState(0);
  const [status, setStatus] = useState('idle');

  const codeLines = [
    { num: '1', parts: [{ text: 'PayPerUseAI', cls: 'text-blue-400' }, { text: ".deploy({", cls: 'text-white/80' }] },
    { num: '2', parts: [{ text: '  model: ', cls: 'text-white/50' }, { text: "'gpt-4o'", cls: 'text-emerald-400' }, { text: ',', cls: 'text-white/50' }] },
    { num: '3', parts: [{ text: '  billing: ', cls: 'text-white/50' }, { text: "'per-token'", cls: 'text-emerald-400' }, { text: ',', cls: 'text-white/50' }] },
    { num: '4', parts: [{ text: '  chain: ', cls: 'text-white/50' }, { text: "'algorand'", cls: 'text-emerald-400' }] },
    { num: '5', parts: [{ text: '})', cls: 'text-white/80' }] },
    { num: '6', parts: [{ text: '// Verified on-chain ✓', cls: 'text-white/25' }] },
  ];

  useEffect(() => {
    if (!inView) return;
    setStatus('typing');
    const timers = codeLines.map((_, i) =>
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === codeLines.length - 1) {
          setTimeout(() => setStatus('compiling'), 400);
          setTimeout(() => setStatus('deployed'), 1200);
          setTimeout(() => setStatus('verified'), 2000);
        }
      }, (i + 1) * 350)
    );
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="terminal-card p-6 md:p-8">
      {/* macOS Chrome */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20 font-mono bg-white/[0.05] px-3 py-1 rounded-md">workflow.ts</span>
        </div>
      </div>

      {/* Code content with typing effect */}
      <div className="font-mono text-sm leading-[1.8]">
        {codeLines.map((line, idx) => (
          <motion.div
            key={idx}
            className="flex"
            initial={{ opacity: 0, x: -10 }}
            animate={idx < visibleLines ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-white/15 w-8 shrink-0 select-none text-right mr-4">{line.num}</span>
            <span>
              {line.parts.map((part, j) => (
                <span key={j} className={part.cls}>{part.text}</span>
              ))}
            </span>
            {idx === visibleLines - 1 && status === 'typing' && (
              <span className="inline-block w-[2px] h-4 bg-white/60 ml-0.5 animate-blink self-center" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Animated status bar */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-3">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            status === 'verified' ? 'bg-emerald-400' :
            status === 'deployed' ? 'bg-blue-400' :
            status === 'compiling' ? 'bg-amber-400' : 'bg-white/20'
          }`}
          animate={status === 'compiling' ? { opacity: [0.4, 1, 0.4] } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-xs font-mono ${
              status === 'verified' ? 'text-emerald-400/70' :
              status === 'deployed' ? 'text-blue-400/70' :
              status === 'compiling' ? 'text-amber-400/70' : 'text-white/30'
            }`}
          >
            {status === 'idle' && 'Waiting...'}
            {status === 'typing' && 'Writing...'}
            {status === 'compiling' && 'Compiling contract...'}
            {status === 'deployed' && 'Deploying to mainnet...'}
            {status === 'verified' && '✓ Verified on Algorand'}
          </motion.span>
        </AnimatePresence>

      </div>
    </div>
  );
};

// ─── Scroll Indicator ───
const ScrollIndicator = () => (
  <motion.div
    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2, duration: 1 }}
  >
    <span className="text-[10px] uppercase tracking-[0.3em] text-muted/50 font-medium">Scroll</span>
    <motion.div
      className="w-5 h-8 rounded-full border border-foreground/15 flex items-start justify-center p-1.5"
      animate={{ borderColor: ['rgba(10,10,10,0.1)', 'rgba(10,10,10,0.2)', 'rgba(10,10,10,0.1)'] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.div
        className="w-1 h-1.5 rounded-full bg-foreground/30"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  </motion.div>
);


/* ═══════════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════════════════════════ */

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

  // ─── Auto-cycle steps in "How it Works" ───
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 5000);
    return () => clearInterval(interval);
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

      setConnectStatus('Please wait...');
      const { nonce } = await getNonce(addr);
      const message = `PayPerUseAI Sign-In\nWallet: ${addr}\nNonce: ${nonce}`;
      const msgBytes = new TextEncoder().encode(message);

      setConnectStatus('Sign in Wallet...');
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
      const redirectPath = sessionStorage.getItem('onboarding_redirect') || '/dashboard';
      sessionStorage.removeItem('onboarding_redirect');
      setConnectStatus('Verifying...');
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

      {/* ═══════════════════════════════════════════ HERO ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen px-6 pt-32 pb-20 md:px-8 flex items-center">
        {/* Parallax dot grid + aurora background */}
        <DotGridBg />

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

            {/* Main heading with split-text entrance */}
            <motion.h1
              variants={staggerItem}
              className="text-5xl md:text-7xl lg:text-[6.2rem] font-medium leading-[0.95] tracking-[-0.04em] text-foreground mb-8"
            >
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 40, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Industrial AI
              </motion.span>
              <br />
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 40, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                without the
              </motion.span>
              <br />
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 40, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                subscription
              </motion.span>
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
                className="btn-primary text-base !px-8 !py-4 group"
              >
                {isConnecting ? (connectStatus || 'Connecting...') : 'Start free trial'}
                <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.youtube.com/watch?v=wxWkeq6ea4A', '_blank');
                }}
                className="btn-secondary text-base !px-8 !py-4 group"
              >
                Watch demo
                <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </motion.div>

            {/* Floating stats strip */}
            <motion.div
              variants={staggerItem}
              className="mt-14 flex flex-wrap items-center gap-3"
            >
              {['4 AI Models', '$0 Lock-in', 'On-Chain Verified', 'Pay Per Task'].map((item, idx) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + idx * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-foreground/60 bg-foreground/[0.03] border border-foreground/[0.06] backdrop-blur-sm"
                >
                  <span className="w-1 h-1 rounded-full bg-accent/60" />
                  {item}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Cube Animation — right side on desktop, shifted slightly right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-0 right-[-10%] bottom-0 w-[55%] hidden lg:flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-[120%] -top-[10%] flex items-center justify-center pointer-events-none" style={{ maskImage: 'linear-gradient(to left, black 30%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 90%)' }}>
              <AbstractHeroAnimation />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator />
      </section>


      {/* ═══════════════════════════════════════ STATS TICKER ═══════════════════════════════════════ */}
      <LiveTicker />

      {/* ═══════════════════════════════════════ ABOUT / FEATURES ═══════════════════════════════════════ */}
      <section id="about" className="px-6 py-28 md:px-8 scroll-mt-32 relative overflow-hidden">
        {/* Subtle aurora background */}
        <div className="absolute inset-0 aurora-bg pointer-events-none" />

        <div className="relative mx-auto max-w-5xl">
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
              <span className="text-gradient">Nothing you don't.</span>
            </motion.h2>
          </motion.div>

          {/* Feature list — Editorial layout with animated dividers */}
          <motion.div
            className="flex flex-col"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Top divider */}
            <motion.div variants={staggerItem} className="divider-animated mb-0" />

            {ABOUT_FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="group"
                variants={staggerItem}
              >
                <div className="py-14 flex flex-col md:flex-row items-start justify-between gap-10 hover:bg-foreground/[0.015] transition-all duration-500 -mx-8 px-8 rounded-2xl cursor-default">
                  <div className="flex items-start gap-8 max-w-2xl">
                    <span className="text-sm font-semibold tracking-wider text-accent mt-1.5 shrink-0 uppercase font-mono">{feature.num}</span>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground group-hover:text-gradient transition-all duration-500">
                        {feature.title}
                      </h3>
                      <p className="mt-4 text-base md:text-lg text-muted leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex shrink-0 opacity-20 group-hover:opacity-60 text-foreground transition-all duration-700 group-hover:scale-110">
                    {feature.icon}
                  </div>
                </div>
                <div className="divider-animated" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════ HOW IT WORKS (DARK) ═══════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="px-6 py-24 md:px-8 bg-[#0a0a0a] text-white scroll-mt-32 relative overflow-hidden"
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.6) 0%, transparent 70%)' }}
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, rgba(100,150,255,0.5) 0%, transparent 70%)' }}
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/10"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

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
                <span className="text-gradient-light">Zero SaaS drama.</span>
              </motion.h2>

              {/* Interactive step selector with glass cards */}
              <div className="mt-14 flex flex-col gap-3">
                {STEPS.map((step, index) => (
                  <motion.button
                    key={step.num}
                    variants={staggerItem}
                    className={`text-left p-6 transition-all duration-500 group cursor-pointer rounded-2xl ${
                      activeStep === index
                        ? 'glass-card-dark !border-white/15'
                        : 'opacity-40 hover:opacity-70 border border-transparent'
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-sm font-mono mt-1 transition-colors ${
                        activeStep === index ? 'text-accent-light' : 'text-white/30'
                      }`}>
                        {step.num}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-medium tracking-[-0.02em]">
                          {step.title}
                        </h3>
                        <AnimatePresence>
                          {activeStep === index && (
                            <motion.p
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              className="text-sm text-white/50 leading-relaxed max-w-md overflow-hidden"
                            >
                              {step.desc}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    {/* Animated progress bar */}
                    {activeStep === index && (
                      <motion.div
                        className="mt-4 h-[2px] bg-gradient-to-r from-accent/60 to-accent/20 rounded-full ml-8"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 4.5, ease: 'linear' }}
                        key={`progress-${index}-${Date.now()}`}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT SIDE — Terminal card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="lg:pt-20"
            >
              <TerminalCard />

              {/* Warning note */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                viewport={{ once: true }}
                className="mt-6 flex items-start gap-3 text-white/25 glass-card-dark p-4 !rounded-xl"
              >
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs leading-relaxed">
                  Missed usage limits reduce system priority and may restrict future requests.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════ SERVICES ═══════════════════════════════════════ */}
      <section id="services-preview" className="px-6 py-28 md:px-8 scroll-mt-32 relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 aurora-bg pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* LEFT — Content */}
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
                <span className="text-gradient">services.</span>
              </motion.h2>

              <motion.p variants={staggerItem} className="mt-6 text-base text-muted leading-relaxed max-w-md">
                Powered by the world's best models. Billed per task. Switch seamlessly without losing context.
              </motion.p>

              {/* Model list with premium styling */}
              <motion.div
                className="mt-10 flex flex-col gap-1"
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
                    className={`flex items-center gap-4 p-4 w-full text-left transition-all duration-500 rounded-xl group ${
                      activeModelIndex === idx
                        ? 'glass-card !border-foreground/15 shadow-sm'
                        : 'hover:bg-foreground/[0.02]'
                    }`}
                  >
                    <span className={`text-foreground transition-all duration-300 ${
                      activeModelIndex === idx ? 'opacity-100 scale-110' : 'opacity-30 group-hover:opacity-60'
                    }`}>
                      {model.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-lg font-medium transition-colors duration-300 ${
                        activeModelIndex === idx ? 'text-foreground' : 'text-muted'
                      }`}>{model.name}</h4>
                      <p className="text-sm text-muted/70 truncate">{model.provider}</p>
                    </div>
                    {model.tag ? (
                      <span className="text-[10px] font-medium uppercase tracking-[0.15em] bg-foreground text-background rounded-full px-3 py-1 shrink-0 relative overflow-hidden">
                        <span className="relative z-10">{model.tag}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-emerald-600 border border-emerald-600/20 rounded-full px-3 py-1 shrink-0">
                        Live
                      </span>
                    )}
                  </motion.button>
                ))}

                <motion.div
                  variants={staggerItem}
                  className="py-4 text-sm text-muted text-center border border-dashed border-foreground/10 rounded-xl mt-2"
                >
                  + More models coming soon
                </motion.div>
              </motion.div>
            </motion.div>

            {/* RIGHT — Dynamic Pricing Card */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="flex items-center justify-center lg:pt-20 relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModelIndex}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-[380px] p-8 relative overflow-hidden border border-black bg-transparent"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/[0.04] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                  <div className="relative">
                    <div className="text-sm font-medium text-accent tracking-[0.2em] uppercase mb-4 font-mono">
                      0{activeModelIndex + 1}
                    </div>
                    <h3 className="text-3xl font-semibold text-foreground tracking-tight mb-3">
                      {AI_MODELS[activeModelIndex].name}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-6">
                      {AI_MODELS[activeModelIndex].desc}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                        <div className="text-[10px] font-bold text-muted tracking-wider uppercase mb-1.5">Input (1M)</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold tracking-tighter text-foreground leading-none">
                            {AI_MODELS[activeModelIndex].usdInput}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-accent mt-1.5">
                          {AI_MODELS[activeModelIndex].algoInput}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-foreground/[0.02] border border-foreground/[0.04]">
                        <div className="text-[10px] font-bold text-muted tracking-wider uppercase mb-1.5">Output (1M)</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold tracking-tighter text-foreground leading-none">
                            {AI_MODELS[activeModelIndex].usdOutput}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-accent mt-1.5">
                          {AI_MODELS[activeModelIndex].algoOutput}
                        </div>
                      </div>
                    </div>

                    <div className="divider-animated mb-6" />

                    <div className="space-y-3 mb-8">
                      {AI_MODELS[activeModelIndex].features.map((feature, i) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-foreground/80">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    <button
                      onClick={(e) => { e.preventDefault(); document.getElementById('join-us')?.scrollIntoView({behavior: 'smooth'})}}
                      className="w-full btn-primary !py-3.5 group"
                    >
                      Start using
                      <svg className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════ STATS TICKER 2 ═══════════════════════════════════════ */}
      <LiveTicker />


      {/* ═══════════════════════════════════════ MARKETPLACE ═══════════════════════════════════════ */}
      <section id="marketplace-preview" className="px-6 py-20 md:py-24 md:px-8 scroll-mt-32 relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">

          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16"
          >
            <div>
              <motion.div variants={staggerItem} className="section-label mb-6">
                Ecosystem
              </motion.div>
              <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95]">
                AI Agent
                <br />
                <span className="text-gradient">Marketplace.</span>
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

          {/* Value prop cards - Full Width Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              {
                title: 'Build & Customize Agents',
                desc: 'Create expert AI workers by defining custom names, models, and tailored system prompt instructions built for specific professional outcomes.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                ),
              },
              {
                title: 'Earn Token Royalties',
                desc: 'Monetize your expertise. Set custom execution royalty fees that split instantly on-chain between creators and the platform.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Secure BYOK Security',
                desc: 'Bring Your Own Key. Maintain absolute session key control using a clean, client-side encrypted key manager.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: 'Creator Profiles',
                desc: 'Showcase your catalog in public profiles featuring live metrics and direct agent messaging.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                ),
              },
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                variants={staggerItem}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-8 group cursor-default gradient-border relative overflow-hidden h-full flex flex-col justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-start gap-6">
                  <motion.div 
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground/[0.04] text-foreground/60 group-hover:bg-accent/10 group-hover:text-accent transition-all duration-500 shadow-sm"
                  >
                    {card.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-accent transition-colors duration-300">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-base text-muted leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════ FEATURES / TRUST SIGNALS ═══════════════════════════════════════ */}
      <section id="why-us" className="px-6 py-28 md:px-8 scroll-mt-32 relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg pointer-events-none" />

        <div className="relative mx-auto max-w-7xl">

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={staggerItem} className="section-label mb-6">
              Why us
            </motion.div>

            <motion.h2 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] leading-[0.95] mb-16">
              Trust signals
              <br />
              <span className="text-gradient">that matter.</span>
            </motion.h2>
          </motion.div>

          {/* Stats Grid — Premium with animated counters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="stats-grid grid-cols-2 md:grid-cols-4 mb-20"
          >
            {TRUST_STATS.map((stat, idx) => (
              <div key={stat.label} className="group">
                <div className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="mt-4 text-sm font-medium uppercase tracking-[0.08em] text-muted group-hover:text-accent transition-colors duration-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Features grid with 3D hover */}
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
                className="glass-card p-6 group cursor-default gradient-border"
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 group-hover:bg-accent/10 group-hover:text-accent transition-all duration-500 mb-4">
                  {f.icon}
                </div>
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


      {/* ═══════════════════════════════════════ FINAL CTA ═══════════════════════════════════════ */}
      <section id="join-us" className="px-6 py-20 md:py-28 md:px-8 scroll-mt-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="border border-black !rounded-3xl overflow-hidden flex flex-col md:flex-row relative bg-transparent"
          >
            {/* Ambient glow */}
            <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[100px] pointer-events-none" />

            <div className="p-10 md:p-16 lg:p-20 flex-1 z-10 flex flex-col justify-center relative">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-[1.05] text-foreground mb-6"
              >
                Ready to build<br />
                <span className="text-gradient">something great?</span>
              </motion.h2>
              <p className="text-lg text-muted/80 max-w-md leading-relaxed mb-10">
                Join thousands of teams shipping faster with PayPerUseAI. Start free, scale infinitely.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full sm:w-auto btn-primary !px-10 !py-4 text-base group"
                >
                  {isConnecting ? (connectStatus || 'Connecting...') : 'Start building free'}
                  <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={() => window.open('mailto:sales@PayPerUseAI.com')}
                  className="w-full sm:w-auto btn-secondary !px-8 !py-4 text-base"
                >
                  Talk to sales
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-muted/50 font-mono tracking-wider">
                  Connect Pera Wallet · Pay per task · No credit card
                </p>
              </div>
            </div>

            {/* Animation Right Side */}
            <div className="flex-1 hidden md:flex items-center justify-center relative min-h-[350px]">
              <div className="absolute inset-0 flex items-center justify-center scale-[0.6] md:scale-[0.7]">
                <AbstractHeroAnimation />
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════ ONBOARDING MODAL ═══════════════════════════════════════ */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-background/70 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboarding(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md glass-card p-8 !bg-white/80"
            >
              {/* Accent glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative">
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
                      className="w-full rounded-xl border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:bg-white"
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
                      className="w-full rounded-xl border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:bg-white"
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
                      className="w-full rounded-xl border border-foreground/10 bg-white/80 px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-300 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 focus:bg-white"
                    />
                  </div>
                  <button
                    disabled={isRegistering}
                    type="submit"
                    className="w-full btn-primary !py-3 disabled:opacity-50 mt-2"
                  >
                    {isRegistering ? 'Registering...' : 'Register Profile'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Home;