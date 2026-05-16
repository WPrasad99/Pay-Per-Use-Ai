import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    const location  = useLocation();
    const navigate  = useNavigate();

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
        try { await peraWallet.disconnect(); }  catch (_) {}
        try { await authLogout(); }             catch (_) {}
        setAccountAddress(null);
        clearWallet();
        navigate('/');
    };

    const navLinks = [
        { to: '/',                 label: 'Home',        isRoute: true },
        { to: '/#about',           label: 'About' },
        { to: '/#how-it-works',    label: 'How It Works' },
        { to: '/#services-preview',label: 'Services' },
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

    const ConnectBtn = ({ mobile = false }) =>
        accountAddress ? (
            <div className={`flex items-center gap-3${mobile ? ' flex-col w-full mt-4' : ''}`}>
                <Link
                    to="/dashboard"
                    className={`btn-primary text-sm !px-6 !py-2.5${mobile ? ' w-full text-center' : ''}`}
                    onClick={mobile ? () => setIsOpen(false) : undefined}
                >
                    Open Workspace
                </Link>
                <button
                    onClick={(ev) => { handleDisconnectWalletClick(ev); if (mobile) setIsOpen(false); }}
                    className={`btn-secondary text-sm !px-4 !py-2.5${mobile ? ' w-full text-center' : ''}`}
                    title="Disconnect Wallet"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        ) : (
            <button
                onClick={(ev) => { handleConnectWalletClick(ev); if (mobile) setIsOpen(false); }}
                disabled={isConnecting}
                className={`btn-primary text-sm !px-6 !py-2.5 disabled:opacity-60 flex items-center justify-center gap-2${mobile ? ' w-full mt-4' : ' min-w-[160px]'}`}
            >
                {isConnecting ? (
                    <>
                        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span className="truncate text-xs">{connectStatus || 'Connecting...'}</span>
                    </>
                ) : 'Connect Wallet'}
            </button>
        );

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
            <div className="max-w-7xl mx-auto floating-nav rounded-2xl px-6 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-black tracking-[-0.04em] text-neo-ink transition-colors group-hover:text-neo-blue">
                        PayPerAI
                    </span>
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map(link =>
                        link.isRoute ? (
                            <Link key={link.label} to={link.to}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-sm font-black text-neo-muted transition-colors hover:text-neo-ink">
                                {link.label}
                            </Link>
                        ) : (
                            <a key={link.label} href={link.to}
                                onClick={(e) => scrollToSection(e, link.to.replace('/', ''))}
                                className="text-sm font-black text-neo-muted transition-colors hover:text-neo-ink">
                                {link.label}
                            </a>
                        )
                    )}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <ConnectBtn />
                </div>

                {/* Mobile toggle */}
                <button onClick={() => setIsOpen(o => !o)} className="md:hidden text-neo-ink p-2">
                    {isOpen
                        ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    }
                </button>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden mt-2 mx-auto max-w-7xl floating-nav rounded-2xl p-6 space-y-4 animate-fade-in">
                    {navLinks.map(link =>
                        link.isRoute ? (
                            <Link key={link.label} to={link.to}
                                className="block font-black text-neo-muted transition-colors hover:text-neo-ink"
                                onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                {link.label}
                            </Link>
                        ) : (
                            <a key={link.label} href={link.to}
                                onClick={(e) => scrollToSection(e, link.to.replace('/', ''))}
                                className="block font-black text-neo-muted transition-colors hover:text-neo-ink">
                                {link.label}
                            </a>
                        )
                    )}
                    <ConnectBtn mobile />
                </div>
            )}

            {/* Onboarding Modal */}
            {showOnboarding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#fff7df]/80 backdrop-blur-sm" />
                    <div className="animate-fadeUp relative w-full max-w-md rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                        <h2 className="mb-2 text-2xl font-black">Complete Profile</h2>
                        <p className="mb-6 text-sm font-bold opacity-60">Please provide your details to continue.</p>
                        
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-black">Full Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={onboardingData.name}
                                    onChange={e => setOnboardingData({...onboardingData, name: e.target.value})}
                                    className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111]"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-black">Email</label>
                                <input 
                                    required 
                                    type="email" 
                                    value={onboardingData.email}
                                    onChange={e => setOnboardingData({...onboardingData, email: e.target.value})}
                                    className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111]"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-black">Date of Birth</label>
                                <input 
                                    required 
                                    type="date" 
                                    value={onboardingData.dob}
                                    onChange={e => setOnboardingData({...onboardingData, dob: e.target.value})}
                                    className="w-full rounded-xl border-2 border-[#111] px-4 py-2 font-black outline-none transition-all focus:border-4 focus:shadow-[4px_4px_0px_#111]"
                                />
                                <p className="mt-1 text-[10px] font-bold opacity-60">You must be at least 18 years old.</p>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isRegistering}
                                className="mt-6 w-full rounded-xl border-2 border-[#111] bg-neo-blue py-3 font-black text-white shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 md:border-4"
                            >
                                {isRegistering ? 'Creating Profile...' : 'Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
