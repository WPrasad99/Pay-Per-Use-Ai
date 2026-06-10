import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/workspace')) {
        return null;
    }

    const footerLinks = [
        { label: 'About', href: '/#about' },
        { label: 'Services', href: '/#services-preview' },
        { label: 'Marketplace', href: '/#marketplace-preview' },
        { label: 'Roadmap', href: '/#how-it-works' },
    ];

    return (
        <footer className="border-t border-foreground/[0.06] mt-auto bg-background">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    {/* Logo & tagline */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold tracking-[-0.02em] text-foreground">
                                PayPerAI
                            </span>
                            <span className="text-[10px] font-medium text-muted tracking-wide">TM</span>
                        </div>
                        <p className="text-sm text-muted max-w-xs">
                            Industrial AI without the subscription trap. Pay only for what you use.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        {footerLinks.map(link => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-6 border-t border-foreground/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                        © 2026 PayPerAI — Debuggers United. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-xs text-muted hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="text-xs text-muted hover:text-foreground transition-colors">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
