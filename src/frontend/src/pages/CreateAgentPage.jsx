import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    createAgent,
    saveCreatorApiKey,
    getCreatorProfile,
    createCreatorProfile
} from '../api/client';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] },
    { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'] },
    { id: 'huggingface', name: 'HuggingFace', models: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3-70b-chat-hf'] },
];

const CATEGORIES = [
    'coding', 'business', 'marketing', 'legal', 'education',
    'productivity', 'content_creation', 'data_analysis', 'creative', 'general'
];

const STEPS = [
    { title: 'Identity', desc: 'Profile & API Key' },
    { title: 'Details', desc: 'Agent branding' },
    { title: 'AI Config', desc: 'Model & Prompts' },
    { title: 'Pricing', desc: 'Payment model' },
    { title: 'Review', desc: 'Publish agent' }
];

const PROVIDER_ICONS = {
    openai: (
        <svg viewBox="0 0 41 41" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M36.48 17.29a10.16 10.16 0 00-.87-8.35 10.28 10.28 0 00-11.07-4.93A10.17 10.17 0 0016.84 1a10.29 10.29 0 00-9.81 7.13 10.17 10.17 0 00-6.8 4.93 10.28 10.28 0 001.27 12.05 10.16 10.16 0 00.87 8.35 10.28 10.28 0 0011.07 4.93A10.17 10.17 0 0021.16 40a10.3 10.3 0 009.82-7.14 10.17 10.17 0 006.79-4.93 10.28 10.28 0 00-1.29-12.05zM21.17 37.5a7.64 7.64 0 01-4.9-1.77l.24-.14 8.13-4.69a1.35 1.35 0 00.68-1.18v-11.46l3.44 1.98a.12.12 0 01.07.1v9.48a7.67 7.67 0 01-7.66 7.68zm-16.47-7.04a7.64 7.64 0 01-.92-5.15l.25.15 8.12 4.69a1.35 1.35 0 001.35 0l9.91-5.72v3.96a.12.12 0 01-.05.11l-8.22 4.74a7.68 7.68 0 01-10.44-2.78zm-2.14-17.82a7.63 7.63 0 014-3.37v9.62a1.35 1.35 0 00.68 1.18l9.9 5.71-3.43 1.98a.13.13 0 01-.12.01L5.1 23.1a7.68 7.68 0 01-.54-10.46zm28.2 6.59l-9.91-5.72 3.43-1.98a.12.12 0 01.12-.01l8.59 4.96a7.67 7.67 0 01-1.19 13.84v-9.62a1.34 1.34 0 00-.44-1.47v-.01zm3.42-5.18l-.25-.15-8.12-4.68a1.35 1.35 0 00-1.36 0l-9.91 5.72V11.08a.13.13 0 01.05-.11l8.22-4.74a7.67 7.67 0 0111.37 7.92zm-21.47 7.07l-3.44-1.98a.12.12 0 01-.07-.1V10.56a7.67 7.67 0 0112.57-5.9l-.24.14-8.13 4.69a1.34 1.34 0 00-.68 1.18l-.01 11.45zm1.87-4.04l4.41-2.55 4.42 2.55v5.08l-4.41 2.55-4.42-2.55V17.08z" fill="currentColor"/>
        </svg>
    ),
    groq: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
    ),
    gemini: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M12 2c0 0 0 0 0 0C12 8.5 16.5 13 22 12c0 0 0 0 0 0C16.5 12 12 16.5 12 22c0 0 0 0 0 0C12 16.5 7.5 12 2 12c0 0 0 0 0 0C7.5 12 12 8.5 12 2z"/>
        </svg>
    ),
    huggingface: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-4 5.5a1 1 0 110 2 1 1 0 010-2zm8 0a1 1 0 110 2 1 1 0 010-2zm-4 3c-2.21 0-4 1.12-4 2.5S9.79 18.5 12 18.5s4-1.12 4-2.5-1.79-2.5-4-2.5z"/>
        </svg>
    ),
};

const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-400 bg-white transition-colors placeholder:text-gray-400';
const labelClass = 'block text-[12px] font-medium text-gray-600 mb-1.5';

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [keyProvider, setKeyProvider] = useState('gemini');
    const [apiKeyInput, setApiKeyInput] = useState('');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [tags, setTags] = useState('');

    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-2.0-flash');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1500);

    const [pricingModel, setPricingModel] = useState('per_token');
    const [pricePerRequest, setPricePerRequest] = useState(0.5);
    const [priceInput, setPriceInput] = useState(1.0);
    const [priceOutput, setPriceOutput] = useState(3.0);

    useEffect(() => {
        if (wallet) {
            getCreatorProfile(wallet)
                .then(profile => {
                    if (profile) {
                        setDisplayName(profile.display_name || '');
                        setBio(profile.bio || '');
                    }
                })
                .catch(() => {});
        }
    }, [wallet]);

    const handleProviderChange = (newProvider) => {
        setProvider(newProvider);
        const firstModel = PROVIDERS.find(p => p.id === newProvider)?.models[0] || '';
        setModel(firstModel);
    };

    const handleNext = (nextStep) => { setDirection(1); setStep(nextStep); };
    const handleBack = (prevStep) => { setDirection(-1); setStep(prevStep); };

    const handleIdentityNext = async () => {
        if (!displayName.trim() || !apiKeyInput.trim()) return;
        setSaving(true); setError(''); setSuccess('');
        try {
            await createCreatorProfile(wallet, displayName.trim(), bio.trim());
            await saveCreatorApiKey(wallet, keyProvider, apiKeyInput.trim());
            setApiKeyInput('');
            setSuccess('Profile & API Key saved.');
            setTimeout(() => { setSuccess(''); handleNext(1); }, 800);
        } catch (e) { setError(e.message || 'Failed to save profile or API key.'); }
        setSaving(false);
    };

    const handlePublish = async () => {
        setSaving(true); setError('');
        try {
            await createAgent({
                creator_wallet: wallet,
                name: name.trim(),
                description: description.trim(),
                category,
                tags: tags.trim(),
                provider,
                model,
                system_prompt: systemPrompt.trim(),
                temperature,
                max_tokens: maxTokens,
                pricing_model: pricingModel,
                price_per_request_microalgo: Math.round(pricePerRequest * 1_000_000),
                price_input_microalgo: Math.round(priceInput * 1_000_000),
                price_output_microalgo: Math.round(priceOutput * 1_000_000),
                visibility: 'public',
            });
            setSuccess('Agent published successfully!');
            setTimeout(() => { navigate('/dashboard/marketplace'); }, 1200);
        } catch (e) { setError(e.message || 'Failed to publish agent.'); }
        setSaving(false);
    };

    if (!wallet) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="border border-gray-200 rounded-2xl p-10 text-center max-w-sm">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Connect your wallet</h2>
                    <p className="text-[13px] text-gray-500">Connect your Pera Wallet to access Creator Studio.</p>
                </div>
            </div>
        );
    }

    const selectedProviderObj = PROVIDERS.find(p => p.id === provider);

    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1, transition: { x: { type: 'spring', stiffness: 260, damping: 26 }, opacity: { duration: 0.18 } } },
        exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { x: { type: 'spring', stiffness: 260, damping: 26 }, opacity: { duration: 0.18 } } })
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/marketplace')}
                        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        Back
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <h1 className="text-[15px] font-semibold text-gray-900">Creator Studio</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Create AI Agent</h2>
                    <p className="text-[14px] text-gray-500">Configure, customize, and monetize your custom AI agent.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
                    {/* Steps Sidebar */}
                    <div className="border border-gray-200 rounded-2xl p-5 bg-white lg:sticky lg:top-20">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4">Steps</p>
                        <div className="relative flex flex-col gap-4">
                            <div className="absolute left-[14px] top-4 bottom-4 w-px bg-gray-200" />
                            {STEPS.map((s, i) => {
                                const isActive = i === step;
                                const isCompleted = i < step;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => i <= step && handleBack(i)}
                                        className={`relative flex items-center gap-3 ${i <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
                                    >
                                        <div className={`relative z-10 h-7 w-7 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0 transition-all ${
                                            isActive ? 'border-gray-900 bg-gray-900 text-white' :
                                            isCompleted ? 'border-green-500 bg-green-50 text-green-600' :
                                            'border-gray-200 bg-white text-gray-400'
                                        }`}>
                                            {isCompleted ? (
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            ) : i + 1}
                                        </div>
                                        <div>
                                            <p className={`text-[13px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{s.title}</p>
                                            <p className="text-[11px] text-gray-400">{s.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Form Panel */}
                    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden">
                        {/* Step indicator */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[13px] font-medium text-gray-700">{STEPS[step].title}</span>
                            <span className="text-[11px] text-gray-400">{step + 1} of {STEPS.length}</span>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[13px] text-green-700">
                                    {success}
                                </div>
                            )}

                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="w-full"
                                >
                                    {/* ── STEP 0: CREATOR PROFILE & API KEY ── */}
                                    {step === 0 && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">Setup Profile & API Key</h3>
                                                <p className="text-[13px] text-gray-500">Configure your creator identity and add a Bring-Your-Own-Key API credential.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>Display Name *</label>
                                                    <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={inputClass} placeholder="e.g. AstroCoder" autoComplete="off" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Bio (optional)</label>
                                                    <input value={bio} onChange={e => setBio(e.target.value)} className={inputClass} placeholder="Your credentials or specialization…" autoComplete="off" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Select Provider & Enter API Key *</label>
                                                <div className="flex gap-2">
                                                    <div className="relative shrink-0">
                                                        <select value={keyProvider} onChange={e => setKeyProvider(e.target.value)} className="appearance-none rounded-lg border border-gray-200 pl-3 pr-8 py-2.5 text-[13px] text-gray-700 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors">
                                                            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                    <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} className={inputClass} placeholder={`Paste your ${PROVIDERS.find(p => p.id === keyProvider)?.name} API key`} autoComplete="new-password" />
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-1.5">Encrypted with AES-256-GCM. Never stored in plaintext.</p>
                                            </div>
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={handleIdentityNext}
                                                    disabled={saving || !displayName.trim() || !apiKeyInput.trim()}
                                                    className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? 'Saving…' : 'Continue →'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 1: AGENT DETAILS ── */}
                                    {step === 1 && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">Agent Branding</h3>
                                                <p className="text-[13px] text-gray-500">Brand your AI agent. Use descriptive keywords to make it discoverable.</p>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Agent Name *</label>
                                                <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="e.g. Solidity Auditor Pro" autoComplete="off" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Description *</label>
                                                <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputClass + ' min-h-[80px] resize-none'} placeholder="What tasks does this agent solve? Be specific." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Category</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {CATEGORIES.map(c => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setCategory(c)}
                                                            className={`rounded-full px-3 py-1 text-[12px] font-medium border transition-colors ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                                        >
                                                            {c.replace(/_/g, ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Tags (comma-separated)</label>
                                                <input value={tags} onChange={e => setTags(e.target.value)} className={inputClass} placeholder="e.g. smart-contract, audit, security" />
                                            </div>
                                            <div className="pt-2 flex gap-2 justify-end">
                                                <button onClick={() => handleBack(0)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
                                                <button onClick={() => name.trim() && description.trim() && handleNext(2)} disabled={!name.trim() || !description.trim()} className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 2: AI CONFIGURATION ── */}
                                    {step === 2 && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">AI Intelligence</h3>
                                                <p className="text-[13px] text-gray-500">Define model behavior and fine-tune the system prompt.</p>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Select AI Provider</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {PROVIDERS.map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => handleProviderChange(p.id)}
                                                            className={`rounded-xl border p-3 text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${provider === p.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                                                        >
                                                            <div className={provider === p.id ? 'text-white' : 'text-gray-500'}>{PROVIDER_ICONS[p.id]}</div>
                                                            <span className="text-[11px] font-medium leading-tight">{p.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Model</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedProviderObj?.models.includes(model) ? model : 'other'}
                                                        onChange={e => setModel(e.target.value === 'other' ? '' : e.target.value)}
                                                        className={inputClass + ' appearance-none pr-8'}
                                                    >
                                                        {(selectedProviderObj?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
                                                        <option value="other">+ Custom model ID</option>
                                                    </select>
                                                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                            {!selectedProviderObj?.models.includes(model) && model !== 'other' && (
                                                <div>
                                                    <label className={labelClass}>Custom Model ID</label>
                                                    <input value={model} onChange={e => setModel(e.target.value)} className={inputClass} placeholder="e.g. Qwen/Qwen2.5-72B-Instruct" />
                                                </div>
                                            )}
                                            <div>
                                                <label className={labelClass}>System Prompt / Instructions *</label>
                                                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className={inputClass + ' min-h-[100px] resize-none'} placeholder="e.g. You are a professional smart contract auditor. Analyze provided Solidity code for flash loan exploits…" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className={labelClass + ' mb-0'}>Temperature</label>
                                                        <span className="text-[11px] text-gray-500 font-medium">{temperature} — {temperature === 0 ? 'Deterministic' : temperature >= 1.2 ? 'Creative' : 'Balanced'}</span>
                                                    </div>
                                                    <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Max Tokens</label>
                                                    <input type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 1500)} className={inputClass} />
                                                </div>
                                            </div>
                                            <div className="pt-2 flex gap-2 justify-end">
                                                <button onClick={() => handleBack(1)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
                                                <button onClick={() => systemPrompt.trim() && handleNext(3)} disabled={!systemPrompt.trim()} className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 3: PRICING ── */}
                                    {step === 3 && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">Custom Pricing</h3>
                                                <p className="text-[13px] text-gray-500">You receive 90% royalties from every usage. 10% platform fee applies.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['per_token', 'per_request'].map(pm => (
                                                    <button
                                                        key={pm}
                                                        type="button"
                                                        onClick={() => setPricingModel(pm)}
                                                        className={`rounded-xl border p-4 text-left cursor-pointer transition-all ${pricingModel === pm ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {pm === 'per_token' ? (
                                                                <svg className={`w-4 h-4 ${pricingModel === pm ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                                                            ) : (
                                                                <svg className={`w-4 h-4 ${pricingModel === pm ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                                                            )}
                                                            <span className="text-[13px] font-medium">{pm === 'per_token' ? 'Per Token' : 'Per Request'}</span>
                                                        </div>
                                                        <p className={`text-[11px] ${pricingModel === pm ? 'text-gray-300' : 'text-gray-400'}`}>
                                                            {pm === 'per_token' ? 'Billed by prompt scale' : 'Flat rate per completion'}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>

                                            {pricingModel === 'per_request' ? (
                                                <div>
                                                    <label className={labelClass}>Price Per Request (ALGO)</label>
                                                    <input type="number" step="0.01" value={pricePerRequest} onChange={e => setPricePerRequest(parseFloat(e.target.value) || 0)} className={inputClass} />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className={labelClass}>Input Price (ALGO / 1M tokens)</label>
                                                        <input type="number" step="0.01" value={priceInput} onChange={e => setPriceInput(parseFloat(e.target.value) || 0)} className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Output Price (ALGO / 1M tokens)</label>
                                                        <input type="number" step="0.01" value={priceOutput} onChange={e => setPriceOutput(parseFloat(e.target.value) || 0)} className={inputClass} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Earnings Simulator */}
                                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Earnings Simulator</p>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 mb-0.5">Estimated Queries</p>
                                                        <p className="text-[15px] font-semibold text-gray-900">10,000</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[11px] text-gray-400 mb-0.5">Your Projected Earnings</p>
                                                        <p className="text-[15px] font-semibold text-gray-900">
                                                            {pricingModel === 'per_request'
                                                                ? `${((pricePerRequest * 10000) * 0.9).toFixed(1)} ALGO`
                                                                : `${((priceInput * 10) * 0.9).toFixed(1)} ALGO (avg)`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 flex gap-2 justify-end">
                                                <button onClick={() => handleBack(2)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
                                                <button onClick={() => handleNext(4)} className="rounded-lg border border-gray-900 bg-gray-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors">Continue →</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 4: REVIEW ── */}
                                    {step === 4 && (
                                        <div className="space-y-5">
                                            <div>
                                                <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">Review & Publish</h3>
                                                <p className="text-[13px] text-gray-500">Review your configuration before publishing to the marketplace.</p>
                                            </div>
                                            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                                {[
                                                    ['Agent Name', name],
                                                    ['Category', category.replace(/_/g, ' ')],
                                                    ['AI Provider', provider.toUpperCase()],
                                                    ['Model ID', model],
                                                    ['Temperature', temperature],
                                                    ['Max Tokens', maxTokens],
                                                    ['Pricing', pricingModel === 'per_request' ? `${pricePerRequest} ALGO / request` : `${priceInput} (in) / ${priceOutput} (out) ALGO per 1M tokens`],
                                                    ['Creator Share', '90% (Instant)'],
                                                ].map(([lbl, val]) => (
                                                    <div key={lbl} className="flex items-center gap-4 px-4 py-3 bg-white">
                                                        <span className="text-[12px] text-gray-400 w-32 shrink-0">{lbl}</span>
                                                        <span className="text-[13px] font-medium text-gray-900 truncate">{String(val)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* System Prompt Preview */}
                                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">System Prompt Preview</p>
                                                <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-4">{systemPrompt || 'No system prompt set.'}</p>
                                            </div>

                                            <div className="pt-2 flex gap-2 justify-end">
                                                <button onClick={() => handleBack(3)} className="rounded-lg border border-gray-200 px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">← Back</button>
                                                <button
                                                    onClick={handlePublish}
                                                    disabled={saving}
                                                    className="rounded-lg border border-gray-900 bg-gray-900 px-6 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {saving ? 'Publishing…' : 'Publish Agent'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}