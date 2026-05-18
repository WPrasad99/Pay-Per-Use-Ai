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
    { id: 'openai', name: 'OpenAI', icon: '🤖', color: '#b7f5c7', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] },
    { id: 'groq', name: 'Groq', icon: '⚡', color: '#ffb3b3', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
    { id: 'gemini', name: 'Google Gemini', icon: '✨', color: '#9fc9ff', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'] },
    { id: 'huggingface', name: 'HuggingFace', icon: '🤗', color: '#fffde7', models: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3-70b-chat-hf'] },
];

const CATEGORIES = [
    'coding',
    'business',
    'marketing',
    'legal',
    'education',
    'productivity',
    'content_creation',
    'data_analysis',
    'creative',
    'general'
];

const STEPS = [
    { title: 'Identity', desc: 'Profile & BYOK Key' },
    { title: 'Details', desc: 'Agent branding' },
    { title: 'AI Config', desc: 'Model & Prompts' },
    { title: 'Pricing', desc: 'Payment model' },
    { title: 'Review', desc: 'Publish agent' }
];

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const wallet =
        localStorage.getItem('wallet_address') ||
        sessionStorage.getItem('wallet_address');

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Step 0: Creator Profile & API Key (Combined)
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [keyProvider, setKeyProvider] = useState('gemini');
    const [apiKeyInput, setApiKeyInput] = useState('');

    // Step 1: Agent Details
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [tags, setTags] = useState('');

    // Step 2: AI Configuration
    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-2.0-flash');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1500);

    // Step 3: Pricing
    const [pricingModel, setPricingModel] = useState('per_token');
    const [pricePerRequest, setPricePerRequest] = useState(0.5);
    const [priceInput, setPriceInput] = useState(1.0);
    const [priceOutput, setPriceOutput] = useState(3.0);

    // Auto load current profile display name if wallet is connected
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
        const firstModel =
            PROVIDERS.find((p) => p.id === newProvider)?.models[0] || '';
        setModel(firstModel);
    };

    const handleNext = (nextStep) => {
        setDirection(1);
        setStep(nextStep);
    };

    const handleBack = (prevStep) => {
        setDirection(-1);
        setStep(prevStep);
    };

    const handleIdentityNext = async () => {
        if (!displayName.trim() || !apiKeyInput.trim()) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // 1. Create/update creator profile
            await createCreatorProfile(
                wallet,
                displayName.trim(),
                bio.trim()
            );

            // 2. Save Secure API Key
            await saveCreatorApiKey(
                wallet,
                keyProvider,
                apiKeyInput.trim()
            );

            setApiKeyInput('');
            setSuccess('🔐 Profile & API Key saved securely!');

            setTimeout(() => {
                setSuccess('');
                handleNext(1);
            }, 800);
        } catch (e) {
            setError(e.message || 'Failed to save profile or API key.');
        }

        setSaving(false);
    };

    const handlePublish = async () => {
        setSaving(true);
        setError('');

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
                price_per_request_microalgo: Math.round(
                    pricePerRequest * 1_000_000
                ),
                price_input_microalgo: Math.round(priceInput * 1_000_000),
                price_output_microalgo: Math.round(priceOutput * 1_000_000),
                visibility: 'public',
            });

            setSuccess('🎉 Agent published successfully!');

            setTimeout(() => {
                navigate('/dashboard/marketplace');
            }, 1500);
        } catch (e) {
            setError(e.message || 'Failed to publish agent.');
        }

        setSaving(false);
    };

    if (!wallet) {
        return (
            <div className="min-h-screen bg-[#fff7df] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_#000] text-center max-w-sm"
                >
                    <div className="text-5xl mb-4">🔐</div>
                    <h2 className="text-2xl font-black mb-2 text-black">
                        Connect Wallet
                    </h2>
                    <p className="font-bold text-neo-muted">
                        Connect your Pera Wallet to access creator studio and publish AI agents.
                    </p>
                </motion.div>
            </div>
        );
    }

    const inputClass =
        'w-full rounded-xl border-2 border-black px-4 py-2.5 font-bold shadow-[3px_3px_0px_#000] bg-white text-black outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_#000] transition-all';

    const btnNext =
        'rounded-xl border-2 border-black bg-[#b7f5c7] px-6 py-2.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-black';

    const btnBack =
        'rounded-xl border-2 border-black bg-white px-6 py-2.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black';

    const selectedProviderObj = PROVIDERS.find((p) => p.id === provider);

    const slideVariants = {
        enter: (dir) => ({
            x: dir > 0 ? 80 : -80,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                x: { type: 'spring', stiffness: 220, damping: 24 },
                opacity: { duration: 0.2 }
            }
        },
        exit: (dir) => ({
            x: dir > 0 ? -80 : 80,
            opacity: 0,
            scale: 0.98,
            transition: {
                x: { type: 'spring', stiffness: 220, damping: 24 },
                opacity: { duration: 0.2 }
            }
        })
    };

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-6xl w-full">
                
                {/* BACK BUTTON */}
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/dashboard/marketplace')}
                    className="text-sm font-black text-black opacity-60 hover:opacity-100 mb-4 flex items-center gap-1 cursor-pointer"
                >
                    ← Back to Marketplace
                </motion.button>

                {/* HEADING */}
                <div className="mb-8">
                    <div className="inline-block border-[3px] border-black bg-[#ffb3b3] px-6 py-2 shadow-[5px_5px_0px_#000] rotate-[-1deg] mb-5">
                        <h1 className="text-2xl md:text-4xl font-black text-black">
                            🛠️ Creator Studio
                        </h1>
                    </div>
                    <p className="text-sm font-bold text-neo-muted ml-1">Configure, customize, and monetize custom AI intelligence.</p>
                </div>

                {/* MAIN LANDSCAPE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
                    
                    {/* LEFT COLUMN: CONTROL DECK (SIDEBAR CHECKLIST) */}
                    <div className="rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000] lg:sticky lg:top-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-4">
                            Wizard Steps
                        </h3>
                        
                        <div className="relative flex flex-col gap-6">
                            {/* VERTICAL CONNECTOR LINE */}
                            <div className="absolute left-[18px] top-4 bottom-4 w-[3px] bg-black/10 rounded-full" />
                            
                            {STEPS.map((s, i) => {
                                const isActive = i === step;
                                const isCompleted = i < step;
                                
                                return (
                                    <div 
                                        key={i}
                                        onClick={() => i <= step && handleBack(i)}
                                        className={`relative grid grid-cols-[38px_1fr] gap-3 items-center group ${i <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                    >
                                        <div className={`relative z-10 h-[38px] w-[38px] rounded-full border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000] transition-all duration-300 ${
                                            isActive ? 'bg-[#ffb3b3] scale-110 shadow-[3px_3px_0px_#000]' 
                                            : isCompleted ? 'bg-[#b7f5c7]' 
                                            : 'bg-white'
                                        }`}>
                                            {isCompleted ? '✓' : i + 1}
                                        </div>
                                        
                                        <div>
                                            <h4 className={`text-sm font-black leading-none transition-colors group-hover:text-black ${isActive ? 'text-black' : 'text-neo-muted'}`}>
                                                {s.title}
                                            </h4>
                                            <p className="text-[10px] font-bold opacity-60 mt-1 leading-none">
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: WORKSPACE CARD */}
                    <div className="rounded-2xl border-4 border-black bg-white p-6 md:p-8 shadow-[10px_10px_0px_#000] flex flex-col relative overflow-hidden transition-all duration-300">
                        
                        {/* STEP PROGRESS BADGE */}
                        <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-xs font-black rounded-lg">
                            STEP {step + 1} OF 5
                        </div>

                        {/* MESSAGES */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border-2 border-red-500 bg-red-100 p-3 mb-4 font-bold text-red-700 text-xs md:text-sm"
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border-2 border-green-500 bg-green-100 p-3 mb-4 font-bold text-green-700 text-xs md:text-sm"
                            >
                                🎉 {success}
                            </motion.div>
                        )}

                        {/* SLIDING ANIMATED WRAPPER */}
                        <div className="pt-2">
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
                                    
                                    {/* ── STEP 0: CREATOR PROFILE & API KEY (COMBINED) ── */}
                                    {step === 0 && (
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-black mb-1">
                                                Setup Profile & API Key
                                            </h2>
                                            <p className="text-sm font-bold text-neo-muted mb-6">
                                                Configure your digital identity and add your secure Bring-Your-Own-Key (BYOK) API key.
                                            </p>

                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Display Name *
                                                        </label>
                                                        <input
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            className={inputClass}
                                                            placeholder="e.g. AstroCoder"
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Bio (optional)
                                                        </label>
                                                        <input
                                                            value={bio}
                                                            onChange={(e) => setBio(e.target.value)}
                                                            className={inputClass}
                                                            placeholder="Describe your credentials, skills, or agent portfolio..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-black mb-2 text-black">
                                                        Select Provider & Enter API Key *
                                                    </label>
                                                    <div className="flex gap-3">
                                                        <select
                                                            value={keyProvider}
                                                            onChange={(e) => setKeyProvider(e.target.value)}
                                                            className="rounded-xl border-2 border-black px-4 py-2.5 font-black shadow-[3px_3px_0px_#000] bg-white text-black outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_#000] transition-all cursor-pointer text-sm shrink-0"
                                                        >
                                                            {PROVIDERS.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        
                                                        <input
                                                            type="password"
                                                            value={apiKeyInput}
                                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                                            className={inputClass}
                                                            placeholder={`Paste your ${PROVIDERS.find(p => p.id === keyProvider)?.name || keyProvider} API key`}
                                                            autoComplete="new-password"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 1: AGENT DETAILS ── */}
                                    {step === 1 && (
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-black mb-1">
                                                Agent Branding
                                            </h2>
                                            <p className="text-sm font-bold text-neo-muted mb-6">
                                                Brand your AI worker. Use descriptive keywords to make your agent discoverable.
                                            </p>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-black mb-1 text-black">
                                                        Agent Name *
                                                    </label>
                                                    <input
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className={inputClass}
                                                        placeholder="e.g. Solidity Auditor Pro"
                                                        autoComplete="off"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-black mb-1 text-black">
                                                        Description *
                                                    </label>
                                                    <textarea
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        className={inputClass + ' h-20 resize-none'}
                                                        placeholder="Provide a clear description of the tasks this agent solves..."
                                                    />
                                                </div>

                                                {/* CATEGORY TAG CLOUD */}
                                                <div>
                                                    <label className="block text-sm font-black mb-2 text-black">
                                                        Category
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {CATEGORIES.map((c) => {
                                                            const isSelected = category === c;
                                                            return (
                                                                <div
                                                                    key={c}
                                                                    onClick={() => setCategory(c)}
                                                                    className={`border-2 border-black rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-tight cursor-pointer transition-all shadow-[2px_2px_0px_#000] ${
                                                                        isSelected 
                                                                        ? 'bg-[#b7f5c7] scale-105' 
                                                                        : 'bg-white text-black hover:-translate-y-0.5'
                                                                    }`}
                                                                >
                                                                    {c.replace(/_/g, ' ')}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-black mb-1 text-black">
                                                        Tags (comma-separated)
                                                    </label>
                                                    <input
                                                        value={tags}
                                                        onChange={(e) => setTags(e.target.value)}
                                                        className={inputClass}
                                                        placeholder="e.g. smart-contract, audit, security"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 2: AI CONFIGURATION ── */}
                                    {step === 2 && (
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-black mb-1">
                                                AI Intelligence
                                            </h2>
                                            <p className="text-sm font-bold text-neo-muted mb-6">
                                                Define model behavior. Fine-tune system prompts to mold the agent's response parameters.
                                            </p>

                                            {/* Provider Choice Cards */}
                                            <label className="block text-sm font-black mb-2 text-black">
                                                Select AI Foundation
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                                {PROVIDERS.map((p) => {
                                                    const isSelected = provider === p.id;
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => handleProviderChange(p.id)}
                                                            className={`border-[3px] border-black rounded-xl p-3 text-center cursor-pointer transition-all ${
                                                                isSelected 
                                                                ? 'bg-black text-white shadow-[3px_3px_0px_#888] scale-105' 
                                                                : 'bg-white text-black hover:-translate-y-0.5 shadow-[3px_3px_0px_#000]'
                                                            }`}
                                                        >
                                                            <div className="text-2xl mb-1">{p.icon}</div>
                                                            <div className="text-xs font-black uppercase tracking-tight">{p.name}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="space-y-4">
                                                {/* Model Selector Card */}
                                                <div>
                                                    <label className="block text-sm font-black mb-1 text-black">
                                                        Model
                                                    </label>
                                                    <select
                                                        value={selectedProviderObj?.models.includes(model) ? model : 'other'}
                                                        onChange={(e) => setModel(e.target.value === 'other' ? '' : e.target.value)}
                                                        className={inputClass}
                                                    >
                                                        {(selectedProviderObj?.models || []).map((m) => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                        <option value="other">➕ Custom Model (Type manually)</option>
                                                    </select>
                                                </div>

                                                {/* Custom Model input */}
                                                {(!selectedProviderObj?.models.includes(model) && model !== 'other') && (
                                                    <div>
                                                        <input
                                                            value={model}
                                                            onChange={(e) => setModel(e.target.value)}
                                                            className={inputClass}
                                                            placeholder="Enter custom huggingface or private model ID"
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-black mb-1 text-black">
                                                        System Prompt / Instructions *
                                                    </label>
                                                    <textarea
                                                        value={systemPrompt}
                                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                                        className={inputClass + ' h-28 resize-none'}
                                                        placeholder="e.g. You are a professional smart contract auditor. Analyze the provided solidity code for flash loan exploits..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="block text-sm font-black text-black">
                                                                Temperature
                                                            </label>
                                                            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                                                {temperature} ({temperature === 0 ? 'Deterministic' : temperature >= 1.2 ? 'Creative' : 'Balanced'})
                                                            </span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="2"
                                                            step="0.1"
                                                            value={temperature}
                                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                                            className="w-full accent-black"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Max Tokens
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={maxTokens}
                                                            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1500)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 3: PRICING ── */}
                                    {step === 3 && (
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-black mb-1">
                                                Custom Pricing
                                            </h2>
                                            <p className="text-sm font-bold text-neo-muted mb-6">
                                                You receive 90% royalties from every usage, processed instantly. 10% platform fee applies.
                                            </p>

                                            <div className="flex gap-4 mb-6">
                                                {['per_token', 'per_request'].map((pm) => {
                                                    const isSelected = pricingModel === pm;
                                                    return (
                                                        <div
                                                            key={pm}
                                                            onClick={() => setPricingModel(pm)}
                                                            className={`flex-1 border-[3px] border-black rounded-xl p-4 text-center cursor-pointer transition-all ${
                                                                isSelected 
                                                                ? 'bg-black text-white shadow-[4px_4px_0px_#888] scale-105' 
                                                                : 'bg-white text-black hover:-translate-y-0.5 shadow-[4px_4px_0px_#000]'
                                                            }`}
                                                        >
                                                            <div className="text-2xl mb-1">{pm === 'per_token' ? '📊' : '💳'}</div>
                                                            <div className="text-sm font-black uppercase tracking-tight">
                                                                {pm === 'per_token' ? 'Per Token' : 'Per Request'}
                                                            </div>
                                                            <p className="text-[10px] opacity-60 mt-1">
                                                                {pm === 'per_token' ? 'Billed by prompt scale' : 'Flat rate per task completion'}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {pricingModel === 'per_request' ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Price Per Request (ALGO)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={pricePerRequest}
                                                            onChange={(e) => setPricePerRequest(parseFloat(e.target.value) || 0)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Input Price (ALGO / 1M tokens)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={priceInput}
                                                            onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-black mb-1 text-black">
                                                            Output Price (ALGO / 1M tokens)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={priceOutput}
                                                            onChange={(e) => setPriceOutput(parseFloat(e.target.value) || 0)}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* PRICING SIMULATOR */}
                                            <div className="mt-6 border-[3px] border-black bg-[#b7f5c7] p-5 rounded-xl shadow-[4px_4px_0px_#000] text-black">
                                                <h4 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-black/20 pb-1">
                                                    Earnings Simulator
                                                </h4>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                                    <div>
                                                        <span className="opacity-75">Estimated Queries</span>
                                                        <div className="text-lg font-black">10,000 requests</div>
                                                    </div>
                                                    <div>
                                                        <span className="opacity-75">Your Projected Net Earnings</span>
                                                        <div className="text-lg font-black text-green-800">
                                                            {pricingModel === 'per_request' 
                                                                ? `${((pricePerRequest * 10000) * 0.9).toFixed(1)} ALGO`
                                                                : `${((priceInput * 10) * 0.9).toFixed(1)} ALGO (average size)`
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── STEP 4: REVIEW ── */}
                                    {step === 4 && (
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-black text-black mb-1">
                                                Review Specs
                                            </h2>
                                            <p className="text-sm font-bold text-neo-muted mb-6">
                                                Your configuration settings. Once published, custom settings will instantly populate the public catalog.
                                            </p>

                                            <div className="border-[3px] border-black rounded-xl overflow-hidden divide-y-2 divide-black text-black bg-white shadow-[4px_4px_0px_#000]">
                                                {[
                                                    ['Agent Name', name],
                                                    ['Category', category.replace(/_/g, ' ')],
                                                    ['AI Foundation', provider.toUpperCase()],
                                                    ['Model ID', model],
                                                    ['Temperature', temperature],
                                                    ['Max Tokens', maxTokens],
                                                    ['Pricing structure', pricingModel === 'per_request' ? `${pricePerRequest} ALGO / request` : `${priceInput} (in) / ${priceOutput} (out) ALGO per 1M tokens`],
                                                    ['Creator Profit Share', '90% (Instant processing)']
                                                ].map(([lbl, val]) => (
                                                    <div key={lbl} className="grid grid-cols-[160px_1fr] gap-4 p-3 text-xs font-bold leading-normal">
                                                        <span className="opacity-60 uppercase tracking-tight">{lbl}</span>
                                                        <span className="font-black text-black truncate">{val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* WIZARD ACTIONS FLOOR */}
                        <div className="flex justify-between mt-6">
                            {step > 0 ? (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleBack(step - 1)}
                                    className={btnBack}
                                >
                                    ← Back
                                </motion.button>
                            ) : (
                                <div />
                            )}

                            {step === 4 ? (
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handlePublish}
                                    disabled={saving}
                                    className="rounded-xl border-2 border-black bg-green-300 px-6 py-2.5 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 text-black cursor-pointer flex-grow md:flex-grow-0 ml-auto"
                                >
                                    {saving ? 'Publishing...' : '🚀 Publish Agent'}
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        if (step === 0) handleIdentityNext();
                                        else if (step === 1 && (!name.trim() || !description.trim())) return;
                                        else if (step === 2 && !systemPrompt.trim()) return;
                                        else handleNext(step + 1);
                                    }}
                                    disabled={
                                        saving ||
                                        (step === 0 && (!displayName.trim() || !apiKeyInput.trim())) ||
                                        (step === 1 && (!name.trim() || !description.trim())) ||
                                        (step === 2 && !systemPrompt.trim())
                                    }
                                    className={btnNext}
                                >
                                    {saving ? 'Validating...' : 'Next →'}
                                </motion.button>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}