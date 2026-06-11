import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Send } from 'lucide-react';

const Footer = () => {
    const location = useLocation();
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/workspace')) {
        return null;
    }

    const [showBackToTop, setShowBackToTop] = useState(false);
    const [emailValue, setEmailValue] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleNewsletterSubmit = useCallback((e) => {
        e.preventDefault();
        if (emailValue.trim()) {
            setSubscribed(true);
            setEmailValue('');
            setTimeout(() => setSubscribed(false), 3000);
        }
    }, [emailValue]);

    const productLinks = [
        { label: 'About', href: '/#about' },
        { label: 'Services', href: '/#services-preview' },
        { label: 'Marketplace', href: '/#marketplace-preview' },
        { label: 'Roadmap', href: '/#how-it-works' },
    ];

    const companyLinks = [
        { label: 'Documentation', href: '#' },
        { label: 'API Reference', href: '#' },
        { label: 'Changelog', href: '#' },
        { label: 'Status', href: '#' },
    ];

    const socialLinks = [
        {
            label: 'Twitter / X',
            href: '#',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
        },
        {
            label: 'GitHub',
            href: '#',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
            ),
        },
        {
            label: 'Discord',
            href: '#',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
            ),
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
            },
        },
    };

    return (
        <footer className="relative mt-auto overflow-hidden">
            {/* Gradient mesh background */}
            <div className="absolute inset-0 gradient-mesh opacity-60" />
            <div className="absolute inset-0 dot-grid opacity-30" />

            {/* Animated gradient divider at top */}
            <div className="divider-animated w-full" />

            {/* Main footer content */}
            <div className="relative z-10">
                <motion.div
                    className="max-w-7xl mx-auto px-6 pt-16 pb-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    {/* Four-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                        {/* Column 1 — Brand & Tagline */}
                        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1">
                            <a
                                href="/"
                                className="group inline-flex items-center gap-2 mb-4"
                            >
                                <span className="text-lg font-bold tracking-[-0.03em] text-foreground transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(139,115,85,0.4)]">
                                    PayPerUseAI
                                </span>
                                <span className="text-[9px] font-semibold text-accent/60 tracking-widest uppercase mt-[-6px]">
                                    TM
                                </span>
                            </a>
                            <p className="text-sm text-muted leading-relaxed max-w-[260px] mb-6">
                                Industrial AI without the subscription trap. Pay only for what you use.
                            </p>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3">
                                {socialLinks.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="group/icon relative flex items-center justify-center w-9 h-9 rounded-xl border border-foreground/[0.08] bg-white/30 backdrop-blur-sm text-muted transition-all duration-300 hover:text-foreground hover:border-accent/30 hover:bg-accent/[0.06] hover:shadow-[0_0_20px_rgba(139,115,85,0.12)]"
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Column 2 — Product Links */}
                        <motion.div variants={itemVariants}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 mb-5">
                                Product
                            </h4>
                            <ul className="space-y-3">
                                {productLinks.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="group/link relative inline-block text-sm text-muted hover:text-foreground transition-colors duration-300"
                                        >
                                            {link.label}
                                            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent/50 transition-all duration-300 ease-out group-hover/link:w-full" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Column 3 — Company Links */}
                        <motion.div variants={itemVariants}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 mb-5">
                                Resources
                            </h4>
                            <ul className="space-y-3">
                                {companyLinks.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="group/link relative inline-block text-sm text-muted hover:text-foreground transition-colors duration-300"
                                        >
                                            {link.label}
                                            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent/50 transition-all duration-300 ease-out group-hover/link:w-full" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Column 4 — Newsletter CTA */}
                        <motion.div variants={itemVariants}>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 mb-5">
                                Stay Updated
                            </h4>
                            <p className="text-sm text-muted leading-relaxed mb-4">
                                Get notified about new AI agents and platform updates.
                            </p>
                            <form onSubmit={handleNewsletterSubmit} className="relative">
                                <div className="relative group/input">
                                    <input
                                        type="email"
                                        value={emailValue}
                                        onChange={(e) => setEmailValue(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border border-foreground/[0.08] bg-white/40 backdrop-blur-sm text-foreground placeholder:text-muted/50 outline-none transition-all duration-300 focus:border-accent/30 focus:bg-white/60 focus:shadow-[0_0_20px_rgba(139,115,85,0.08)]"
                                    />
                                    <button
                                        type="submit"
                                        aria-label="Subscribe"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-foreground text-background transition-all duration-300 hover:bg-accent hover:scale-105 active:scale-95"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {subscribed && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="text-xs text-accent mt-2 font-medium"
                                        >
                                            ✓ Thanks for subscribing!
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </form>
                        </motion.div>
                    </div>

                    {/* Bottom divider */}
                    <div className="divider-animated w-full mt-12 mb-6" />

                    {/* Bottom bar */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                            <p className="text-xs text-muted">
                                © 2026 PayPerUseAI — Debuggers United. All rights reserved.
                            </p>
                            <div className="flex items-center gap-4">
                                <a
                                    href="#"
                                    className="group/link relative inline-block text-xs text-muted hover:text-foreground transition-colors duration-300"
                                >
                                    Privacy
                                    <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent/50 transition-all duration-300 ease-out group-hover/link:w-full" />
                                </a>
                                <a
                                    href="#"
                                    className="group/link relative inline-block text-xs text-muted hover:text-foreground transition-colors duration-300"
                                >
                                    Terms
                                    <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent/50 transition-all duration-300 ease-out group-hover/link:w-full" />
                                </a>
                            </div>
                        </div>

                        {/* Built on Algorand badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/[0.04] backdrop-blur-sm">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                            </span>
                            <span className="text-[11px] font-medium text-accent tracking-wide">
                                Built on Algorand
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Back to Top Button */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={scrollToTop}
                        aria-label="Back to top"
                        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-foreground text-background shadow-elevated transition-all duration-300 hover:bg-accent hover:shadow-[0_8px_30px_rgba(139,115,85,0.3)] hover:scale-110 active:scale-95"
                    >
                        <ArrowUp size={18} strokeWidth={2.5} />
                    </motion.button>
                )}
            </AnimatePresence>
        </footer>
    );
};

export default Footer;
