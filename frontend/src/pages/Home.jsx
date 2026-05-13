import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SERVICES_PREVIEW = [
    { icon: '🔍', name: 'Code Reviewer', desc: 'Security, performance, and PR-ready code audit summaries.', price: '0.5', tag: 'Engineering' },
    { icon: '📊', name: 'Data Analyst', desc: 'Turn CSVs, numbers, and messy notes into boardroom insights.', price: '2.0', tag: 'Operations' },
    { icon: '📧', name: 'Sales Writer', desc: 'Personalized cold outreach, follow-ups, and objection handlers.', price: '0.5', tag: 'Revenue' },
    { icon: '🧾', name: 'Policy Summarizer', desc: 'Readable summaries for documents, SOPs, and compliance drafts.', price: '1.0', tag: 'Admin' },
    { icon: '🤖', name: 'Humanize Text', desc: 'Clean, natural business writing without subscription lock-in.', price: '0.5', tag: 'Content' },
];

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

const ROADMAP = [
    'Industry templates for legal, HR, finance, sales, and support teams',
    'Team workspaces with roles, budgets, and monthly spend limits',
    'Invoice export with transaction IDs for accounting and audits',
    'BYOK / model choice layer so companies can choose cost vs quality',
    'Document upload, knowledge base, and private project memory',
    'Admin analytics: cost per task, saved hours, and department usage',
];

const TRUST_STATS = [
    { value: '0', label: 'subscription lock-in' },
    { value: '1 tx', label: 'verifiable payment proof' },
    { value: '24h', label: 'session allowance window' },
];

const Home = () => {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setIsWalletConnected(!!sessionStorage.getItem('wallet_address'));

        // trigger fade-in after mount
        setMounted(true);
    }, []);

    return (
        <div
            className={`overflow-x-hidden bg-neo-cream text-neo-ink transition-all duration-700 ease-out
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >

            {/* HERO */}
            <section className="relative min-h-screen px-4 sm:px-5 pt-24 pb-16 md:px-8 flex items-center">
                <div className="neo-grid absolute inset-0 opacity-70" />

                <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 grid-cols-1 lg:grid-cols-[1.06fr_0.94fr]">

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
                        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <div className="neo-card bg-neo-ink p-4 text-white shadow-brutal-lg">
                        <h2 className="text-xl md:text-2xl font-black">Pay only for tasks</h2>

                        <div className="mt-5 space-y-4">
                            {SERVICES_PREVIEW.slice(0, 3).map((service) => (
                                <div
                                    key={service.name}
                                    className="flex items-center gap-3 rounded-2xl bg-white p-3 text-neo-ink transition hover:translate-x-1"
                                >
                                    <div className="text-2xl">{service.icon}</div>
                                    <div className="flex-1">
                                        <p className="font-black text-sm">{service.name}</p>
                                        <p className="text-xs text-neo-muted truncate">{service.desc}</p>
                                    </div>
                                    <div className="font-black text-sm">{service.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="px-4 sm:px-5 py-20 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl md:text-6xl font-black">
                        Three steps. Zero SaaS drama.
                    </h2>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {STEPS.map((step) => (
                            <div key={step.num} className="neo-card bg-white p-6 transition hover:-translate-y-2">
                                <div className="text-4xl">{step.icon}</div>
                                <h3 className="mt-4 text-xl font-black">{step.title}</h3>
                                <p className="mt-2 text-neo-muted font-semibold">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SERVICES */}
            <section id="services-preview" className="px-4 sm:px-5 py-20 md:px-8">
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl md:text-6xl font-black">AI micro-services</h2>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {SERVICES_PREVIEW.map((service) => (
                            <div key={service.name} className="neo-card bg-white p-5 transition hover:-translate-y-2">
                                <div className="text-3xl">{service.icon}</div>
                                <h3 className="mt-3 font-black">{service.name}</h3>
                                <p className="mt-2 text-sm text-neo-muted">{service.desc}</p>
                                <div className="mt-4 font-black">{service.price} ALGO</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section id="why-us" className="px-4 sm:px-5 py-20 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl md:text-6xl font-black">
                        Trust signals that matter
                    </h2>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="neo-card bg-white p-6 transition hover:scale-105">
                                <div className="text-2xl">{f.icon}</div>
                                <h3 className="mt-3 text-xl font-black">{f.title}</h3>
                                <p className="mt-2 text-neo-muted">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROADMAP */}
            <section id="final-round" className="px-4 sm:px-5 py-20 md:px-8">
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-3xl md:text-6xl font-black">
                        What we refine next
                    </h2>

                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {ROADMAP.map((item, i) => (
                            <div key={item} className="neo-card bg-white p-4 flex gap-3 transition hover:translate-x-1">
                                <span className="font-black">{i + 1}.</span>
                                <p className="font-semibold">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;