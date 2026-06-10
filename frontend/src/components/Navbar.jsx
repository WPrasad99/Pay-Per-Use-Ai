import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Wallet, Loader2, ArrowRight, User, Mail, Calendar, Sparkles } from 'lucide-react';
import { peraWallet } from '../config/peraWallet';
import { getUserProfile, getNonce, verifySiwa, authLogout, registerUser } from '../api/client';

// ── Persistent wallet helpers (24-hour expiry in localStorage) ──
const WALLET_KEY = 'wallet_address';
const WALLET_EXPIRY_KEY = 'wallet_expiry';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const getPersistedWallet = () => {
    const addr = localStorage.getItem(WALLET_KEY);
    const expiry = localStorage.getItem(WALLET_EXPIRY_KEY);
    if (!addr || !expiry) return null;
    if (Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem(WALLET_KEY);
        localStorage.removeItem(WALLET_EXPIRY_KEY);
        sessionStorage.removeItem(WALLET_KEY);
        return null;
    }
    return addr;
};

const persistWallet = (addr) => {
    localStorage.setItem(WALLET_KEY, addr);
    localStorage.setItem(WALLET_EXPIRY_KEY, (Date.now() + SESSION_DURATION_MS).toString());
    sessionStorage.setItem(WALLET_KEY, addr);
};

const clearWallet = () => {
    localStorage.removeItem(WALLET_KEY);
    localStorage.removeItem(WALLET_EXPIRY_KEY);
    sessionStorage.clear();
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [accountAddress, setAccountAddress] = useState(() => getPersistedWallet());
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectStatus, setConnectStatus] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingData, setOnboardingData] = useState({ name: '', dob: '', email: '' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const location  = useLocation();
    const navigate  = useNavigate();
    const observerRef = useRef(null);

    // ── Scroll listener ──
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ── IntersectionObserver for active section tracking ──
    useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection('');
            return;
        }

        const sectionIds = ['about', 'how-it-works', 'services-preview', 'marketplace-preview', 'why-us', 'join-us'];

        const callback = (entries) => {
            const visible = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visible.length > 0) {
                setActiveSection(visible[0].target.id);
            }
        };

        observerRef.current = new IntersectionObserver(callback, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: [0, 0.25, 0.5],
        });

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) observerRef.current.observe(el);
        });

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [location.pathname]);

    // ── Lock body scroll when mobile menu is open ──
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const storedAddr = getPersistedWallet();
        peraWallet.reconnectSession().then((accounts) => {
            peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);
            if (peraWallet.isConnected && accounts.length) {
                const addr = accounts[0];
                if (storedAddr === addr) {
                    persistWallet(addr); // refresh the 24h expiry
                    setAccountAddress(addr);
                }
            } else if (storedAddr) {
                // Restore from localStorage even if peraWallet session expired
                setAccountAddress(storedAddr);
            }
        }).catch(() => {
            if (storedAddr) setAccountAddress(storedAddr);
        });
    }, []);

    const handleConnectWalletClick = async (e) => {
        if (e) e.preventDefault();
        if (isConnecting) return;
        setIsConnecting(true);
        setConnectStatus('Connecting wallet...');

        try {
            // Step 1: Connect via Pera Wallet (QR scan)
            let accounts = [];
            try { accounts = await peraWallet.reconnectSession(); } catch (_) {}
            if (!accounts || accounts.length === 0) {
                accounts = await peraWallet.connect();
            }
            if (!accounts || accounts.length === 0) throw new Error('Connection cancelled.');
            peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);
            const addr = accounts[0];

            // Step 2: Get nonce from backend
            setConnectStatus('Getting verification challenge...');
            const { nonce } = await getNonce(addr);
            const message = `PayPerAI Sign-In\nWallet: ${addr}\nNonce: ${nonce}`;

            // Step 3: Ask Pera Wallet to sign the message (signData — no ALGO cost)
            setConnectStatus('Sign the message in Pera Wallet...');
            const msgBytes  = new TextEncoder().encode(message);
            const signedData = await peraWallet.signData(
                [{ data: msgBytes, message }],
                addr
            );

            // Step 4: Base64-encode signature and verify with backend
            setConnectStatus('Verifying...');
            const sigBytes = signedData[0] instanceof Uint8Array
                ? signedData[0]
                : new Uint8Array(Object.values(signedData[0]));
            const sigB64 = btoa(Array.from(sigBytes, b => String.fromCharCode(b)).join(''));
            await verifySiwa(addr, message, sigB64);

            // Step 5: Save persistently (24h) and navigate
            persistWallet(addr);
            setAccountAddress(addr);
            try {
                await getUserProfile(addr);
                navigate('/dashboard');
            } catch (err) {
                if (err.status === 404 || (err.message && err.message.toLowerCase().includes('not found'))) {
                    setShowOnboarding(true);
                } else {
                    throw err;
                }
            }

        } catch (err) {
            try {
                if (peraWallet.isConnected) {
                    await peraWallet.disconnect();
                }
            } catch (_) {}
            if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') {
                console.error('SIWA connect error:', err.message || err);
                alert('Sign-in failed: ' + (err.message || 'Unknown error'));
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
            await registerUser(accountAddress, onboardingData.name, onboardingData.dob, onboardingData.email);
            setShowOnboarding(false);
            navigate('/dashboard');
        } catch (err) {
            alert('Registration failed: ' + (err.message || 'Unknown error'));
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDisconnectWalletClick = async (e) => {
        if (e) e.preventDefault();
        try {
            if (peraWallet.isConnected) {
                await peraWallet.disconnect();
            }
        }  catch (_) {}
        try { await authLogout(); }             catch (_) {}
        setAccountAddress(null);
        clearWallet();
        navigate('/');
    };

    const navLinks = [
        { to: '/',                 label: 'Home',        isRoute: true },
        { to: '/#about',           label: 'About' },
        { to: '/#how-it-works',    label: 'Roadmap' },
        { to: '/#services-preview',label: 'Services' },
        { to: '/#marketplace-preview', label: 'Marketplace' },
        { to: '/#why-us',          label: 'Why Us' },
        { to: '/#join-us',         label: 'Join Us' },
    ];

    const scrollToSection = (e, hash) => {
        if (location.pathname === '/') {
            e.preventDefault();
            if (hash === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
            else {
                const el = document.querySelector(hash);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
            setIsOpen(false);
        }
    };

    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/onboarding')) {
        return null;
    }

    // ── Helper: check if a nav link is the active section ──
    const isActive = (link) => {
        if (link.isRoute) {
            return activeSection === '' && location.pathname === '/' && window.scrollY < 200;
        }
        const hash = link.to.replace('/#', '');
        return activeSection === hash;
    };

    // ── Connect Button component ──
    const ConnectBtn = ({ mobile = false }) =>
        accountAddress ? (
            <div className={`flex items-center gap-2.5 ${mobile ? 'flex-col w-full mt-6' : ''}`}>
                <Link
                    to="/dashboard"
                    className={`group btn-primary text-sm !px-6 !py-2.5 flex items-center gap-2 ${mobile ? 'w-full text-center justify-center' : ''}`}
                    onClick={mobile ? () => setIsOpen(false) : undefined}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Open Workspace
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(ev) => { handleDisconnectWalletClick(ev); if (mobile) setIsOpen(false); }}
                    className={`rounded-full border border-foreground/10 p-2.5 text-foreground/50 hover:text-foreground hover:border-foreground/25 hover:bg-foreground/[0.04] transition-all duration-300 ${mobile ? 'w-full flex justify-center' : ''}`}
                    title="Disconnect Wallet"
                >
                    <LogOut className="w-4 h-4" />
                </motion.button>
            </div>
        ) : (
            <div className="relative">
                {/* Pulse ring when disconnected */}
                {!isConnecting && (
                    <span className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />
                )}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={(ev) => { handleConnectWalletClick(ev); if (mobile) setIsOpen(false); }}
                    disabled={isConnecting}
                    className={`btn-primary text-sm !px-6 !py-2.5 disabled:opacity-60 flex items-center justify-center gap-2.5 relative z-10 ${mobile ? 'w-full mt-6' : 'min-w-[160px]'}`}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span className="truncate text-xs">{connectStatus || 'Connecting...'}</span>
                        </>
                    ) : (
                        <>
                            <Wallet className="w-3.5 h-3.5" />
                            Connect Wallet
                        </>
                    )}
                </motion.button>
            </div>
        );

    // ── Mobile menu link animation variants ──
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
    };

    const menuContainerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
        exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
    };

    const menuItemVariants = {
        hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, y: -15, filter: 'blur(4px)', transition: { duration: 0.2, ease: 'easeIn' } },
    };

    // ── Onboarding modal animation ──
    const modalBackdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.35 } },
        exit: { opacity: 0, transition: { duration: 0.25 } },
    };

    const modalContentVariants = {
        hidden: { opacity: 0, scale: 0.92, y: 20, filter: 'blur(10px)' },
        visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 } },
        exit: { opacity: 0, scale: 0.95, y: 10, filter: 'blur(6px)', transition: { duration: 0.25 } },
    };

    return (
        <>
            {/* ═══════ MAIN NAVBAR ═══════ */}
            <motion.nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    scrolled ? 'pt-3 px-4' : 'pt-5 px-5 md:px-8'
                }`}
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
                <div
                    className={`mx-auto flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        scrolled
                            ? 'w-full max-w-[900px] rounded-full px-5 py-2.5 floating-nav shadow-elevated'
                            : 'w-full max-w-7xl rounded-2xl px-3 py-3 bg-transparent'
                    }`}
                    style={scrolled ? {
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 4px 30px rgba(0,0,0,0.06)',
                    } : {}}
                >
                    {/* ─── Logo ─── */}
                    <Link to="/" className="flex items-center gap-1.5 group shrink-0">
                        <motion.span
                            className="text-base font-semibold text-foreground select-none"
                            style={{ letterSpacing: '-0.02em' }}
                            whileHover={{ letterSpacing: '0.06em' }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            PayPerAI
                        </motion.span>
                        <span className="text-[9px] font-medium text-foreground/30 tracking-wide group-hover:text-accent transition-colors duration-500">
                            TM
                        </span>
                    </Link>

                    {/* ─── Desktop Nav Links ─── */}
                    <div className="hidden md:flex items-center gap-0.5">
                        {navLinks.map(link => {
                            const active = isActive(link);
                            const linkClasses = `relative px-3.5 py-1.5 text-[13px] font-medium transition-all duration-300 rounded-full ${
                                active
                                    ? 'text-foreground'
                                    : 'text-foreground/50 hover:text-foreground hover:bg-foreground/[0.04]'
                            }`;

                            return link.isRoute ? (
                                <Link
                                    key={link.label}
                                    to={link.to}
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className={linkClasses}
                                >
                                    {link.label}
                                    {/* Active indicator dot */}
                                    {active && (
                                        <motion.span
                                            layoutId="nav-active-indicator"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            ) : (
                                <a
                                    key={link.label}
                                    href={link.to}
                                    onClick={(e) => scrollToSection(e, link.to.replace('/', ''))}
                                    className={linkClasses}
                                >
                                    {link.label}
                                    {active && (
                                        <motion.span
                                            layoutId="nav-active-indicator"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </div>

                    {/* ─── Desktop CTA ─── */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                        <ConnectBtn />
                    </div>

                    {/* ─── Mobile Menu Toggle ─── */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(o => !o)}
                        className="md:hidden relative text-foreground p-2 rounded-full hover:bg-foreground/[0.06] transition-colors duration-300 z-[61]"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <X className="w-5 h-5" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Menu className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </motion.nav>

            {/* ═══════ MOBILE FULL-SCREEN OVERLAY ═══════ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-[55] md:hidden"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Frosted glass backdrop */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: 'rgba(245, 245, 240, 0.88)',
                                backdropFilter: 'blur(30px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
                            }}
                        />

                        {/* Content */}
                        <motion.div
                            className="relative flex flex-col items-center justify-center h-full px-8"
                            variants={menuContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* Nav Links */}
                            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                                {navLinks.map((link, i) => {
                                    const active = isActive(link);
                                    return (
                                        <motion.div
                                            key={link.label}
                                            variants={menuItemVariants}
                                            className="w-full"
                                        >
                                            {link.isRoute ? (
                                                <Link
                                                    to={link.to}
                                                    className={`block w-full text-center text-2xl font-medium py-3 rounded-2xl transition-all duration-300 ${
                                                        active
                                                            ? 'text-foreground bg-foreground/[0.05]'
                                                            : 'text-foreground/50 hover:text-foreground hover:bg-foreground/[0.03]'
                                                    }`}
                                                    onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                >
                                                    {link.label}
                                                    {active && (
                                                        <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-accent align-middle" />
                                                    )}
                                                </Link>
                                            ) : (
                                                <a
                                                    href={link.to}
                                                    onClick={(e) => scrollToSection(e, link.to.replace('/', ''))}
                                                    className={`block w-full text-center text-2xl font-medium py-3 rounded-2xl transition-all duration-300 ${
                                                        active
                                                            ? 'text-foreground bg-foreground/[0.05]'
                                                            : 'text-foreground/50 hover:text-foreground hover:bg-foreground/[0.03]'
                                                    }`}
                                                >
                                                    {link.label}
                                                    {active && (
                                                        <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-accent align-middle" />
                                                    )}
                                                </a>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <motion.div
                                variants={menuItemVariants}
                                className="w-16 h-px bg-foreground/10 my-6"
                            />

                            {/* Connect Button */}
                            <motion.div variants={menuItemVariants} className="w-full max-w-xs">
                                <ConnectBtn mobile />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ ONBOARDING MODAL ═══════ */}
            <AnimatePresence>
                {showOnboarding && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        variants={modalBackdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

                        {/* Modal Card */}
                        <motion.div
                            className="relative w-full max-w-md glass-card p-8 md:p-10"
                            variants={modalContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                boxShadow: '0 25px 80px rgba(0,0,0,0.08), 0 0 0 1px rgba(139,115,85,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
                            }}
                        >
                            {/* Decorative sparkle */}
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-accent" />
                            </div>

                            {/* Header */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                                    Complete Profile
                                </h2>
                                <p className="mt-1.5 text-sm text-foreground/50">
                                    Please provide your details to continue.
                                </p>
                            </div>

                            <form onSubmit={handleRegisterSubmit} className="space-y-5">
                                {/* Full Name */}
                                <div className="group">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/70">
                                        <User className="w-3.5 h-3.5 text-accent/60" />
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={onboardingData.name}
                                        onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                                        className="w-full rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm font-normal text-foreground outline-none transition-all duration-300 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:bg-white placeholder:text-foreground/25"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {/* Email */}
                                <div className="group">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/70">
                                        <Mail className="w-3.5 h-3.5 text-accent/60" />
                                        Email
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={onboardingData.email}
                                        onChange={e => setOnboardingData({...onboardingData, email: e.target.value})}
                                        className="w-full rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm font-normal text-foreground outline-none transition-all duration-300 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:bg-white placeholder:text-foreground/25"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div className="group">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/70">
                                        <Calendar className="w-3.5 h-3.5 text-accent/60" />
                                        Date of Birth
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={onboardingData.dob}
                                        onChange={e => setOnboardingData({...onboardingData, dob: e.target.value})}
                                        className="w-full rounded-xl border border-foreground/10 bg-white/60 px-4 py-3 text-sm font-normal text-foreground outline-none transition-all duration-300 focus:border-accent/40 focus:ring-2 focus:ring-accent/10 focus:bg-white"
                                    />
                                    <p className="mt-1.5 text-xs text-foreground/35">
                                        You must be at least 18 years old.
                                    </p>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isRegistering}
                                    className="mt-3 w-full btn-primary !py-3.5 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isRegistering ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating Profile...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
