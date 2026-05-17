import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorAgents, deactivateAgent, getApiKeyStatus, saveCreatorApiKey, getCreatorProfile, createCreatorProfile } from '../api/client';

const CATEGORY_EMOJIS = { coding: '💻', business: '📊', marketing: '📣', legal: '⚖️', education: '📚', productivity: '⚡', content_creation: '✍️', data_analysis: '📈', creative: '🎨', general: '🌐' };

const PROVIDER_LABELS = { gemini: 'Google Gemini', openai: 'OpenAI', groq: 'Groq', huggingface: 'HuggingFace' };

export default function MyAgentsPage() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    // API Key Modal state
    const [activeAgent, setActiveAgent] = useState(null); // The agent whose key is being updated
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [keyStatusList, setKeyStatusList] = useState([]);
    const [keySuccess, setKeySuccess] = useState('');
    const [keyError, setKeyError] = useState('');

    useEffect(() => { if (wallet) loadAgents(); }, [wallet]);

    const loadAgents = async () => {
        setLoading(true);
        try { const res = await getCreatorAgents(wallet); setAgents(res.agents || []); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleDeactivate = async (agentId) => {
        if (!confirm('Are you sure you want to deactivate this agent?')) return;
        try { await deactivateAgent(agentId, wallet); loadAgents(); } catch (e) { alert(e.message); }
    };

    const openKeyModal = async (agent) => {
        setActiveAgent(agent);
        setApiKeyInput('');
        setKeySuccess('');
        setKeyError('');
        setIsApiKeyModalOpen(true);
        // Load existing key status
        try {
            const status = await getApiKeyStatus(wallet);
            setKeyStatusList(status.keys || []);
        } catch (e) {
            setKeyStatusList([]);
        }
    };

    const closeKeyModal = () => {
        setIsApiKeyModalOpen(false);
        setActiveAgent(null);
        setApiKeyInput('');
        setKeySuccess('');
        setKeyError('');
    };

    const handleSaveKey = async () => {
        if (!apiKeyInput.trim() || !activeAgent) return;
        const agentProvider = activeAgent.provider || 'gemini';
        setIsSavingKey(true);
        setKeySuccess('');
        setKeyError('');
        try {
            try { await getCreatorProfile(wallet); } catch { await createCreatorProfile(wallet, 'Creator', ''); }
            await saveCreatorApiKey(wallet, agentProvider, apiKeyInput.trim());
            setApiKeyInput('');
            const status = await getApiKeyStatus(wallet);
            setKeyStatusList(status.keys || []);
            const label = PROVIDER_LABELS[agentProvider] || agentProvider;
            setKeySuccess(`✅ ${label} key saved! Your agent will now use the new key.`);
            setTimeout(() => closeKeyModal(), 2500);
        } catch (e) {
            setKeyError(e.message || 'Failed to save key. Please try again.');
        }
        setIsSavingKey(false);
    };

    if (!wallet) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-xl font-black">Connect Wallet</h2>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-2">← Back</button>
                        <h1 className="text-3xl font-black">📦 My Agents</h1>
                    </div>
                    <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-4 border-[#111] bg-purple-300 px-5 py-2.5 font-black shadow-[6px_6px_0px_#111] hover:-translate-y-1 transition-all">+ New Agent</button>
                </div>

                {loading ? (
                    <div className="text-center py-20"><div className="text-4xl animate-bounce mb-3">📦</div><p className="font-black">Loading...</p></div>
                ) : agents.length === 0 ? (
                    <div className="rounded-2xl border-4 border-[#111] bg-white p-10 shadow-[6px_6px_0px_#111] text-center">
                        <div className="text-5xl mb-4">🤖</div>
                        <h3 className="text-xl font-black mb-2">No agents yet</h3>
                        <p className="font-bold opacity-60 mb-4">Create your first AI agent and start earning</p>
                        <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-2 border-[#111] bg-purple-300 px-5 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 transition-all">✨ Create Agent</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {agents.map(agent => (
                            <div key={agent.agent_id} className="rounded-2xl border-4 border-[#111] bg-white p-5 shadow-[6px_6px_0px_#111] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:-translate-y-0.5">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-14 h-14 shrink-0 rounded-xl border-2 border-[#111] bg-purple-100 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#111]">
                                        {CATEGORY_EMOJIS[agent.category] || '🤖'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-lg truncate">{agent.name}</h3>
                                        <p className="text-sm font-bold opacity-60">{PROVIDER_LABELS[agent.provider] || agent.provider} · {agent.model}</p>
                                        <div className="flex gap-3 mt-1 text-xs font-black opacity-50">
                                            <span>🔥 {agent.total_uses || 0} uses</span>
                                            <span>⭐ {agent.avg_rating > 0 ? agent.avg_rating.toFixed(1) : 'N/A'}</span>
                                            <span>💰 {((agent.total_revenue_microalgo || 0) / 1_000_000).toFixed(4)} ALGO</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                    <span className={`rounded-full border-2 border-[#111] px-3 py-1 text-xs font-black ${agent.is_active ? 'bg-green-200' : 'bg-red-200'}`}>
                                        {agent.is_active ? '🟢 Active' : '🔴 Inactive'}
                                    </span>
                                    {/* 🔐 Update API Key — directly on the agent card */}
                                    <button
                                        onClick={() => openKeyModal(agent)}
                                        className="rounded-xl border-2 border-[#111] bg-cyan-200 px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                    >
                                        🔐 Update Key
                                    </button>
                                    {agent.is_active && (
                                        <button
                                            onClick={() => handleDeactivate(agent.agent_id)}
                                            className="rounded-xl border-2 border-[#111] bg-red-200 px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                        >
                                            Deactivate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🔐 Agent-specific API Key Update Modal */}
            {isApiKeyModalOpen && activeAgent && (() => {
                const agentProvider = activeAgent.provider || 'gemini';
                const providerLabel = PROVIDER_LABELS[agentProvider] || agentProvider;
                const existingKey = keyStatusList.find(k => k.provider === agentProvider);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                            {/* Header */}
                            <div className="mb-5 flex items-center justify-between border-b-4 border-[#111] pb-3">
                                <div>
                                    <h2 className="text-lg font-black flex items-center gap-2">🔐 Update API Key</h2>
                                    <p className="text-xs font-bold opacity-50 mt-0.5">For agent: {activeAgent.name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeKeyModal}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#111] bg-pink-100 hover:bg-[#111] hover:text-white transition-all font-black shadow-[2px_2px_0px_#111]"
                                >
                                    ✕
                                </button>
                            </div>

                            {keySuccess && (
                                <div className="mb-4 rounded-xl border-2 border-green-500 bg-green-100 p-3 text-sm font-black text-green-700">{keySuccess}</div>
                            )}
                            {keyError && (
                                <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-100 p-3 text-sm font-black text-red-700">{keyError}</div>
                            )}

                            {/* Agent config info — locked */}
                            <div className="mb-4 rounded-xl border-2 border-[#111] bg-[#fff7df] p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Agent Configuration</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="rounded-lg border-2 border-[#111] bg-purple-200 px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#111] uppercase">
                                        {providerLabel}
                                    </span>
                                    <span className="rounded-lg border-2 border-[#111] bg-yellow-100 px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#111]">
                                        {activeAgent.model}
                                    </span>
                                    <span className={`ml-auto rounded-full border-2 border-[#111] px-2.5 py-1 text-[10px] font-black ${existingKey ? 'bg-green-200' : 'bg-red-100'}`}>
                                        {existingKey ? `🟢 Key set (${existingKey.key_hint})` : '🔴 No key saved'}
                                    </span>
                                </div>
                            </div>

                            {/* Key input */}
                            <div className="mb-4">
                                <label className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1.5">
                                    Paste your fresh {providerLabel} API key
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={e => setApiKeyInput(e.target.value)}
                                    placeholder={`sk-... or AIza... — your ${agentProvider} key`}
                                    className="w-full rounded-xl border-2 border-[#111] px-3 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-50 bg-white transition-all"
                                    autoComplete="off"
                                />
                            </div>

                            <p className="text-[11px] font-bold opacity-50 leading-relaxed mb-4">
                                🔒 Encrypted with AES-256-GCM. Your key is never stored in plaintext or logged anywhere.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={closeKeyModal}
                                    className="flex-1 rounded-xl border-2 border-[#111] bg-white p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingKey || !apiKeyInput.trim()}
                                    onClick={handleSaveKey}
                                    className="flex-1 rounded-xl border-2 border-[#111] bg-purple-300 p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingKey ? 'Encrypting...' : '🔐 Save & Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
