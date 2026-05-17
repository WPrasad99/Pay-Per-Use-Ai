import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAgent, getApiKeyStatus, saveCreatorApiKey, getCreatorProfile, createCreatorProfile } from '../api/client';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] },
    { id: 'groq', name: 'Groq', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'] },
    { id: 'huggingface', name: 'HuggingFace', models: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3-70b-chat-hf'] },
];
const CATEGORIES = ['coding','business','marketing','legal','education','productivity','content_creation','data_analysis','creative','general'];

export default function CreateAgentPage() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');

    // Steps: 0=profile, 1=apikey, 2=basic, 3=config, 4=pricing, 5=review
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Step 0 — Profile fields (always blank for new agent creation)
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // Step 1 — API key fields (always blank, never show old keys)
    const [keyProvider, setKeyProvider] = useState('gemini');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [keySaved, setKeySaved] = useState(false); // just tracks if key was saved this session

    // Step 2 — Agent basic info (always blank)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('general');
    const [tags, setTags] = useState('');

    // Step 3 — AI config (always defaults)
    const [provider, setProvider] = useState('gemini');
    const [model, setModel] = useState('gemini-2.0-flash');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1500);

    // Step 4 — Pricing (always defaults)
    const [pricingModel, setPricingModel] = useState('per_token');
    const [pricePerRequest, setPricePerRequest] = useState(0.5);
    const [priceInput, setPriceInput] = useState(1.0);
    const [priceOutput, setPriceOutput] = useState(3.0);

    // When provider changes in step 3, reset model to that provider's first model
    const handleProviderChange = (newProvider) => {
        setProvider(newProvider);
        const firstModel = PROVIDERS.find(p => p.id === newProvider)?.models[0] || '';
        setModel(firstModel);
    };

    // Step 0 handler — save/update profile then advance
    const handleProfileNext = async () => {
        if (!displayName.trim()) return;
        setSaving(true); setError('');
        try {
            await createCreatorProfile(wallet, displayName.trim(), bio.trim());
            setStep(1);
        } catch (e) {
            setError(e.message || 'Failed to save profile. Please try again.');
        }
        setSaving(false);
    };

    // Step 1 handler — save API key then advance
    const handleSaveKeyAndNext = async () => {
        if (!apiKeyInput.trim()) return;
        setSaving(true); setError('');
        try {
            // Ensure profile exists first
            try {
                await getCreatorProfile(wallet);
            } catch {
                await createCreatorProfile(wallet, displayName.trim() || 'Creator', bio.trim());
            }
            await saveCreatorApiKey(wallet, keyProvider, apiKeyInput.trim());
            setApiKeyInput(''); // Clear after save for security
            setKeySaved(true);
            setSuccess('🔐 API key saved securely!');
            setTimeout(() => { setSuccess(''); setStep(2); }, 800);
        } catch (e) {
            setError(e.message || 'Failed to save API key. Please try again.');
        }
        setSaving(false);
    };

    // Step 5 handler — publish agent
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
            setSuccess('🎉 Agent published successfully!');
            setTimeout(() => navigate('/dashboard/marketplace'), 1500);
        } catch (e) {
            setError(e.message || 'Failed to publish agent. Please try again.');
        }
        setSaving(false);
    };

    if (!wallet) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center p-4">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-xl font-black mb-2">Connect Wallet</h2>
                <p className="font-bold opacity-60">Connect your Pera Wallet to create AI agents</p>
            </div>
        </div>
    );

    const cardClass = "rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111] mb-6";
    const inputClass = "w-full rounded-xl border-2 border-[#111] px-4 py-2.5 font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-100 transition-all";
    const btnNext = "rounded-xl border-2 border-[#111] bg-purple-300 px-6 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const btnBack = "rounded-xl border-2 border-[#111] bg-white px-6 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 transition-all";

    const selectedProviderObj = PROVIDERS.find(p => p.id === provider);

    // Step progress indicator
    const steps = ['Profile', 'API Key', 'Details', 'AI Config', 'Pricing', 'Review'];

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/dashboard/marketplace')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-4 flex items-center gap-1">← Back to Marketplace</button>
                <h1 className="text-3xl font-black mb-2">✨ Create AI Agent</h1>

                {/* Step indicator */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                    {steps.map((s, i) => (
                        <div key={i} className={`flex items-center gap-1 shrink-0 rounded-full border-2 border-[#111] px-3 py-1 text-xs font-black transition-all ${
                            i === step ? 'bg-[#111] text-white shadow-[2px_2px_0px_#555]'
                            : i < step ? 'bg-green-200'
                            : 'bg-white opacity-40'
                        }`}>
                            {i < step ? '✓' : i + 1}. {s}
                        </div>
                    ))}
                </div>

                {error && <div className="rounded-xl border-2 border-red-500 bg-red-100 p-3 mb-4 font-bold text-red-700 text-sm">{error}</div>}
                {success && <div className="rounded-xl border-2 border-green-500 bg-green-100 p-3 mb-4 font-bold text-green-700 text-sm">{success}</div>}

                {/* ── Step 0: Creator Profile ── */}
                {step === 0 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-1">Step 1: Creator Profile</h2>
                        <p className="text-sm font-bold opacity-60 mb-4">Set up your creator identity. This is shown on your agent's public page.</p>
                        <label className="block text-sm font-black mb-1">Display Name *</label>
                        <input
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className={inputClass + ' mb-3'}
                            placeholder="Your creator name"
                            autoComplete="off"
                        />
                        <label className="block text-sm font-black mb-1">Bio (optional)</label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className={inputClass + ' mb-5 h-20 resize-none'}
                            placeholder="Tell users about yourself..."
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleProfileNext}
                                disabled={saving || !displayName.trim()}
                                className={btnNext}
                            >
                                {saving ? 'Saving...' : 'Next →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 1: API Key ── */}
                {step === 1 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-1">Step 2: Add API Key (BYOK)</h2>
                        <p className="text-sm font-bold opacity-60 mb-4">
                            Your key is encrypted with AES-256-GCM and never exposed. This key will be used when users interact with your agent.
                        </p>
                        <div className="rounded-xl border-2 border-[#111] bg-yellow-50 p-3 mb-4 text-xs font-bold opacity-70">
                            💡 Get a free Gemini key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-blue-600">aistudio.google.com</a> · OpenAI at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline text-blue-600">platform.openai.com</a>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <select
                                value={keyProvider}
                                onChange={e => setKeyProvider(e.target.value)}
                                className="rounded-xl border-2 border-[#111] px-3 py-2.5 font-bold shadow-[3px_3px_0px_#111] bg-white shrink-0"
                            >
                                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input
                                type="password"
                                value={apiKeyInput}
                                onChange={e => setApiKeyInput(e.target.value)}
                                className={inputClass}
                                placeholder={`Paste your ${keyProvider} API key`}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="flex gap-2 justify-between">
                            <button onClick={() => setStep(0)} className={btnBack}>← Back</button>
                            <button
                                onClick={handleSaveKeyAndNext}
                                disabled={saving || !apiKeyInput.trim()}
                                className={btnNext}
                            >
                                {saving ? 'Encrypting...' : '🔐 Save Key & Next →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Agent Details ── */}
                {step === 2 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-4">Step 3: Agent Details</h2>
                        <label className="block text-sm font-black mb-1">Agent Name *</label>
                        <input value={name} onChange={e => setName(e.target.value)} className={inputClass + ' mb-3'} placeholder="My AI Assistant" autoComplete="off" />
                        <label className="block text-sm font-black mb-1">Description *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputClass + ' mb-3 h-20 resize-none'} placeholder="What does your agent do?" />
                        <label className="block text-sm font-black mb-1">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass + ' mb-3'}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                        </select>
                        <label className="block text-sm font-black mb-1">Tags (comma-separated)</label>
                        <input value={tags} onChange={e => setTags(e.target.value)} className={inputClass + ' mb-5'} placeholder="python, code, assistant" />
                        <div className="flex gap-2 justify-between">
                            <button onClick={() => setStep(1)} className={btnBack}>← Back</button>
                            <button onClick={() => setStep(3)} disabled={!name.trim() || !description.trim()} className={btnNext}>Next →</button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: AI Config ── */}
                {step === 3 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-4">Step 4: AI Configuration</h2>
                        <label className="block text-sm font-black mb-1">Provider</label>
                        <select
                            value={provider}
                            onChange={e => handleProviderChange(e.target.value)}
                            className={inputClass + ' mb-3'}
                        >
                            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <label className="block text-sm font-black mb-1">Model</label>
                        <select
                            value={selectedProviderObj?.models.includes(model) ? model : 'other'}
                            onChange={e => setModel(e.target.value === 'other' ? '' : e.target.value)}
                            className={inputClass + ' mb-3'}
                        >
                            {(selectedProviderObj?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="other">➕ Other (type custom model name)</option>
                        </select>
                        {(!selectedProviderObj?.models.includes(model) && model !== 'other') && (
                            <input
                                value={model}
                                onChange={e => setModel(e.target.value)}
                                className={inputClass + ' mb-3'}
                                placeholder="Enter custom model name"
                            />
                        )}
                        <label className="block text-sm font-black mb-1">System Prompt / Instructions *</label>
                        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className={inputClass + ' mb-3 h-32 resize-none'} placeholder="You are a helpful assistant that..." />
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div>
                                <label className="block text-sm font-black mb-1">Temperature ({temperature})</label>
                                <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-black mb-1">Max Tokens</label>
                                <input type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 1500)} className={inputClass} />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-between">
                            <button onClick={() => setStep(2)} className={btnBack}>← Back</button>
                            <button onClick={() => setStep(4)} disabled={!systemPrompt.trim() || !model.trim()} className={btnNext}>Next →</button>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Pricing ── */}
                {step === 4 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-1">Step 5: Pricing</h2>
                        <p className="text-sm font-bold opacity-60 mb-4">You earn 90% of revenue. 10% goes to the platform.</p>
                        <div className="flex gap-2 mb-4">
                            {['per_token', 'per_request'].map(pm => (
                                <button
                                    key={pm}
                                    onClick={() => setPricingModel(pm)}
                                    className={`flex-1 rounded-xl border-2 border-[#111] px-4 py-2 text-sm font-black shadow-[3px_3px_0px_#111] transition-all ${pricingModel === pm ? 'bg-[#111] text-white' : 'bg-white'}`}
                                >
                                    {pm === 'per_token' ? '📊 Per Token' : '💳 Per Request'}
                                </button>
                            ))}
                        </div>
                        {pricingModel === 'per_request' ? (
                            <div className="mb-4">
                                <label className="block text-sm font-black mb-1">Price Per Request (ALGO)</label>
                                <input type="number" step="0.01" value={pricePerRequest} onChange={e => setPricePerRequest(parseFloat(e.target.value) || 0)} className={inputClass} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="block text-sm font-black mb-1">Input Price (ALGO / 1M tokens)</label>
                                    <input type="number" step="0.01" value={priceInput} onChange={e => setPriceInput(parseFloat(e.target.value) || 0)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-black mb-1">Output Price (ALGO / 1M tokens)</label>
                                    <input type="number" step="0.01" value={priceOutput} onChange={e => setPriceOutput(parseFloat(e.target.value) || 0)} className={inputClass} />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 justify-between mt-2">
                            <button onClick={() => setStep(3)} className={btnBack}>← Back</button>
                            <button onClick={() => setStep(5)} className={btnNext}>Review →</button>
                        </div>
                    </div>
                )}

                {/* ── Step 5: Review & Publish ── */}
                {step === 5 && (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black mb-4">🚀 Review & Publish</h2>
                        <div className="space-y-2 text-sm font-bold mb-6">
                            {[
                                ['Agent Name', name],
                                ['Category', category.replace(/_/g, ' ')],
                                ['Provider', provider],
                                ['Model', model],
                                ['Temperature', temperature],
                                ['Max Tokens', maxTokens],
                                ['Pricing', pricingModel === 'per_request' ? `${pricePerRequest} ALGO / request` : `${priceInput} / ${priceOutput} ALGO per 1M tokens`],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between border-b border-gray-200 pb-1">
                                    <span className="opacity-60">{label}</span>
                                    <span className="font-black text-right max-w-[60%] truncate">{value}</span>
                                </div>
                            ))}
                            <div className="flex justify-between">
                                <span className="opacity-60">Your Share</span>
                                <span className="text-green-600 font-black">90%</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setStep(4)} className={btnBack}>← Back</button>
                            <button
                                onClick={handlePublish}
                                disabled={saving}
                                className="flex-1 rounded-xl border-4 border-[#111] bg-green-300 px-6 py-3 font-black shadow-[6px_6px_0px_#111] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_#111] transition-all disabled:opacity-50"
                            >
                                {saving ? 'Publishing...' : '🚀 Publish Agent'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
