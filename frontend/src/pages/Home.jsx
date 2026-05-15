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
        navigate('/dashboard');
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
              <Link to="/" className="btn-primary">
                {isWalletConnected ? 'Open workspace →' : 'Connect wallet →'}
              </Link>
              <a href="#final-round" className="btn-secondary">
                Product roadmap
              </a>
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
              alt="Hero section image"
            />
          </div>
        </div>
      </section>


      {/* LIVETICKER */}
      <div>
        <LiveTicker variant="light" />
      </div>


      {/* ABOUT */}
      <Reveal>
        <section id="about" className="px-4 sm:px-5 py-20 md:px-8">
          <div className="mx-auto max-w-7xl">

            {/* HEADER */}
            <h2 className="text-3xl md:text-6xl font-black">
              About PayPerAI
            </h2>

            <p className="mt-4 text-lg md:text-xl font-semibold text-neo-muted max-w-3xl">
              A decentralized AI infrastructure platform that lets you access multiple AI models
              using blockchain-powered pay-per-use smart sessions.
            </p>

            {/* CARDS */}
            <motion.div
              className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {ABOUT_FEATURES.map((itemData) => (
                <motion.div
                  key={itemData.title}
                  className="neo-card bg-white p-6 transition hover:-translate-y-2"
                  variants={item}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-4xl">{itemData.icon}</div>

                  <h3 className="mt-4 text-xl font-black">
                    {itemData.title}
                  </h3>

                  <p className="mt-2 text-neo-muted font-semibold">
                    {itemData.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </section>
      </Reveal>




      {/* HOW IT WORKS + INFO PANEL */}
      <motion.section
        id="how-it-works"
        className="px-4 py-20 sm:px-6 md:px-8"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-16 lg:grid-cols-2">

            {/* LEFT SIDE */}
            <div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                Three steps. Zero SaaS drama.
              </h2>

              <motion.div
                className="mt-16 flex flex-col gap-12"
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {STEPS.map((step, index) => (
                  <motion.div
                    key={step.num}
                    className="grid grid-cols-[70px_1fr] gap-5"
                    variants={item}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Number + Line */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border-[3px] border-black text-lg font-black shadow-[4px_4px_0px_#000] bg-yellow-100">
                        {step.num}
                      </div>

                      {index !== STEPS.length - 1 && (
                        <div className="mt-3 h-full w-[4px] bg-black/20 rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="inline-block rounded-lg border-[3px] border-black bg-white px-5 py-2 shadow-[4px_4px_0px_#000]">
                        <h3 className="text-xl md:text-2xl font-black">
                          {step.title}
                        </h3>
                      </div>

                      <div className="mt-4 rounded-lg border-[3px] border-black bg-[#f3f3f3] p-6 shadow-[5px_5px_0px_#000]">
                        <div className="mb-4 text-4xl">{step.icon}</div>

                        <p className="text-base leading-relaxed font-semibold text-black/80">
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

              <motion.h3
                className="text-4xl md:text-5xl font-black tracking-tight"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                The Math
              </motion.h3>

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
      <section id="services-preview" className="px-4 sm:px-5 py-20 md:px-8 overflow-hidden">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-6xl font-black">AI micro-services</h2>
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
                alt="PayPerAI dashboard demo"
                className="w-full h-auto object-contain scale-110 md:scale-125 transition-transform duration-500"
              />
            </motion.div>

          </div>
        </div>
      </section>




      {/* FEATURES */}
      <section id="why-us" className="px-4 sm:px-5 py-20 md:px-8">

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
      <section className="px-4 sm:px-5 py-24 md:py-32 md:px-8 overflow-hidden">
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

    </div>
  );
};

export default Home;