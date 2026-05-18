import React, { useState } from 'react';
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

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const wallet =
        localStorage.getItem('wallet_address') ||
        sessionStorage.getItem('wallet_address');

    const [step, setStep] = useState(0);
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

    const handleProviderChange = (newProvider) => {
        setProvider(newProvider);
        const firstModel =
            PROVIDERS.find((p) => p.id === newProvider)?.models[0] || '';
        setModel(firstModel);
    };

    const handleProfileNext = async () => {
        if (!displayName.trim()) return;

        setSaving(true);
        setError('');

        try {
            await createCreatorProfile(
                wallet,
                displayName.trim(),
                bio.trim()
            );

            setStep(1);
        } catch (e) {
            setError(e.message || 'Failed to save profile.');
        }

        setSaving(false);
    };

    const handleSaveKeyAndNext = async () => {
        if (!apiKeyInput.trim()) return;

        setSaving(true);
        setError('');

        try {
            try {
                await getCreatorProfile(wallet);
            } catch {
                await createCreatorProfile(
                    wallet,
                    displayName.trim() || 'Creator',
                    bio.trim()
                );
            }

            await saveCreatorApiKey(
                wallet,
                keyProvider,
                apiKeyInput.trim()
            );

            setApiKeyInput('');
            setSuccess('🔐 API key saved securely!');

            setTimeout(() => {
                setSuccess('');
                setStep(2);
            }, 800);
        } catch (e) {
            setError(e.message || 'Failed to save API key.');
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
                    className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center"
                >
                    <div className="text-5xl mb-4">🔐</div>
                    <h2 className="text-xl font-black mb-2">
                        Connect Wallet
                    </h2>
                    <p className="font-bold opacity-60">
                        Connect your Pera Wallet to create AI agents
                    </p>
                </motion.div>
            </div>
        );
    }

    const cardClass =
        'rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111]';

    const inputClass =
        'w-full rounded-xl border-2 border-[#111] px-4 py-2.5 font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-100 transition-all';

    const btnNext =
        'rounded-xl border-2 border-[#111] bg-purple-300 px-6 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50';

    const btnBack =
        'rounded-xl border-2 border-[#111] bg-white px-6 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-1 transition-all';

    const selectedProviderObj = PROVIDERS.find(
        (p) => p.id === provider
    );

    const steps = [
        'Profile',
        'API Key',
        'Details',
        'AI Config',
        'Pricing',
        'Review'
    ];

    const pageVariants = {
        initial: {
            opacity: 0,
            x: 80,
            scale: 0.96,
            rotate: 1.5
        },
        animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            rotate: 0
        },
        exit: {
            opacity: 0,
            x: -80,
            scale: 0.94,
            rotate: -1.5
        }
    };

    return (
        <div className="min-h-screen bg-[#fff7df] overflow-hidden p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/dashboard/marketplace')}
                    className="text-sm font-bold opacity-60 hover:opacity-100 mb-4 flex items-center gap-1"
                >
                    ← Back to Marketplace
                </motion.button>

                <motion.h1
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-black mb-2"
                >
                    ✨ Create AI Agent
                </motion.h1>

                {/* STEP BAR */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: i === step ? 1.05 : 1,
                            }}
                            className={`flex items-center gap-1 shrink-0 rounded-full border-2 border-[#111] px-3 py-1 text-xs font-black transition-all ${
                                i === step
                                    ? 'bg-[#111] text-white shadow-[3px_3px_0px_#555]'
                                    : i < step
                                    ? 'bg-green-200'
                                    : 'bg-white opacity-50'
                            }`}
                        >
                            {i < step ? '✓' : i + 1}. {s}
                        </motion.div>
                    ))}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border-2 border-red-500 bg-red-100 p-3 mb-4 font-bold text-red-700 text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border-2 border-green-500 bg-green-100 p-3 mb-4 font-bold text-green-700 text-sm"
                    >
                        {success}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">

                    {/* STEP 0 */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                duration: 0.45,
                                type: 'spring',
                                stiffness: 120
                            }}
                            className={cardClass}
                        >
                            <h2 className="text-lg font-black mb-1">
                                Step 1: Creator Profile
                            </h2>

                            <p className="text-sm font-bold opacity-60 mb-4">
                                Set up your creator identity.
                            </p>

                            <label className="block text-sm font-black mb-1">
                                Display Name *
                            </label>

                            <input
                                value={displayName}
                                onChange={(e) =>
                                    setDisplayName(e.target.value)
                                }
                                className={inputClass + ' mb-3'}
                                placeholder="Your creator name"
                            />

                            <label className="block text-sm font-black mb-1">
                                Bio
                            </label>

                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className={inputClass + ' mb-5 h-20 resize-none'}
                                placeholder="Tell users about yourself..."
                            />

                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={{
                                        scale: 1.05,
                                        y: -2
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleProfileNext}
                                    disabled={saving || !displayName.trim()}
                                    className={btnNext}
                                >
                                    {saving ? 'Saving...' : 'Next →'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 1 */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                duration: 0.45,
                                type: 'spring',
                                stiffness: 120
                            }}
                            className={cardClass}
                        >
                            <h2 className="text-lg font-black mb-1">
                                Step 2: Add API Key
                            </h2>

                            <p className="text-sm font-bold opacity-60 mb-4">
                                Your key is encrypted and secure.
                            </p>

                            <div className="flex gap-2 mb-4">
                                <select
                                    value={keyProvider}
                                    onChange={(e) =>
                                        setKeyProvider(e.target.value)
                                    }
                                    className="rounded-xl border-2 border-[#111] px-3 py-2.5 font-bold shadow-[3px_3px_0px_#111] bg-white"
                                >
                                    {PROVIDERS.map((p) => (
                                        <option
                                            key={p.id}
                                            value={p.id}
                                        >
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) =>
                                        setApiKeyInput(e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Paste API Key"
                                />
                            </div>

                            <div className="flex justify-between">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStep(0)}
                                    className={btnBack}
                                >
                                    ← Back
                                </motion.button>

                                <motion.button
                                    whileHover={{
                                        scale: 1.05,
                                        y: -2
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveKeyAndNext}
                                    disabled={
                                        saving || !apiKeyInput.trim()
                                    }
                                    className={btnNext}
                                >
                                    {saving
                                        ? 'Encrypting...'
                                        : '🔐 Save & Next'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{
                                duration: 0.45,
                                type: 'spring',
                                stiffness: 120
                            }}
                            className={cardClass}
                        >
                            <h2 className="text-lg font-black mb-4">
                                Step 3: Agent Details
                            </h2>

                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={inputClass + ' mb-3'}
                                placeholder="Agent Name"
                            />

                            <textarea
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                className={inputClass + ' mb-3 h-24 resize-none'}
                                placeholder="Describe your AI agent..."
                            />

                            <select
                                value={category}
                                onChange={(e) =>
                                    setCategory(e.target.value)
                                }
                                className={inputClass + ' mb-4'}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-between">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStep(1)}
                                    className={btnBack}
                                >
                                    ← Back
                                </motion.button>

                                <motion.button
                                    whileHover={{
                                        scale: 1.05,
                                        y: -2
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStep(3)}
                                    className={btnNext}
                                >
                                    Next →
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}