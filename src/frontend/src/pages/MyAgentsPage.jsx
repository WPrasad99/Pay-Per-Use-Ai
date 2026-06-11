import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorAgents, deactivateAgent, getApiKeyStatus, saveCreatorApiKey, getCreatorProfile, createCreatorProfile } from '../api/client';

const CATEGORY_ICONS = {
    coding: (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
    ),
    business: (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
    ),
    general: (
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
        </svg>
    ),
};

const PROVIDER_LABELS = { gemini: 'Google Gemini', openai: 'OpenAI', groq: 'Groq', huggingface: 'HuggingFace' };

export default function MyAgentsPage() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeAgent, setActiveAgent] = useState(null);
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
        try {
            const status = await getApiKeyStatus(wallet);
            setKeyStatusList(status.keys || []);
        } catch (e) { setKeyStatusList([]); }
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
            setKeySuccess(`${label} key saved! Your agent will now use the new key.`);
            setTimeout(() => closeKeyModal(), 2500);
        } catch (e) {
            setKeyError(e.message || 'Failed to save key. Please try again.');
        }
        setIsSavingKey(false);
    };

    if (!wallet) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="border border-gray-200 rounded-2xl p-10 text-center max-w-sm">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h2 className="text-[15px] font-semibold text-gray-800 mb-1">Connect your wallet</h2>
                <p className="text-[13px] text-gray-500">Please connect your wallet to manage agents.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                            Back
                        </button>
                        <div className="h-4 w-px bg-gray-200" />
                        <h1 className="text-[15px] font-semibold text-gray-900">My Agents</h1>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/create-agent')} 
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        New Agent
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Your AI Agents</h2>
                    <p className="text-[14px] text-gray-500">Manage and monitor your deployed agents.</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[14px] text-gray-500">Loading agents…</p>
                        </div>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-200 rounded-2xl">
                        <div className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center mb-4">
                            {CATEGORY_ICONS.general}
                        </div>
                        <h3 className="text-[15px] font-semibold text-gray-800 mb-1">No agents yet</h3>
                        <p className="text-[13px] text-gray-500 mb-6">Create your first AI agent and start earning.</p>
                        <button 
                            onClick={() => navigate('/dashboard/create-agent')} 
                            className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Create Agent
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                        {agents.map(agent => (
                            <div key={agent.agent_id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 shrink-0 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                                        {CATEGORY_ICONS[agent.category] || CATEGORY_ICONS.general}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[14px] text-gray-900 truncate">{agent.name}</h3>
                                        <p className="text-[12px] text-gray-400 mt-0.5">{PROVIDER_LABELS[agent.provider] || agent.provider} · {agent.model}</p>
                                        <div className="flex gap-4 mt-1.5 text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
                                                {agent.total_uses || 0} uses
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                                {agent.avg_rating > 0 ? agent.avg_rating.toFixed(1) : 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                                                {((agent.total_revenue_microalgo || 0) / 1_000_000).toFixed(4)} ALGO
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 ${agent.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {agent.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={() => openKeyModal(agent)}
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                        Update Key
                                    </button>
                                    {agent.is_active && (
                                        <button
                                            onClick={() => handleDeactivate(agent.agent_id)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
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

            {/* API Key Modal */}
            {isApiKeyModalOpen && activeAgent && (() => {
                const agentProvider = activeAgent.provider || 'gemini';
                const providerLabel = PROVIDER_LABELS[agentProvider] || agentProvider;
                const existingKey = keyStatusList.find(k => k.provider === agentProvider);
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                        Update API Key
                                    </h2>
                                    <p className="text-[12px] text-gray-400 mt-0.5">For agent: {activeAgent.name}</p>
                                </div>
                                <button onClick={closeKeyModal} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {keySuccess && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[13px] text-green-700">{keySuccess}</div>}
                            {keyError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">{keyError}</div>}

                            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">Agent Configuration</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{providerLabel}</span>
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{activeAgent.model}</span>
                                    <span className={`ml-auto rounded-full border px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5 ${existingKey ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${existingKey ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {existingKey ? `Key set (${existingKey.key_hint})` : 'No key saved'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                                    {providerLabel} API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={e => setApiKeyInput(e.target.value)}
                                    placeholder={`sk-... or AIza...`}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-400 bg-white transition-colors"
                                    autoComplete="off"
                                />
                            </div>

                            <p className="text-[11px] text-gray-400 leading-relaxed mb-5">
                                Encrypted with AES-256-GCM. Your key is never stored in plaintext or logged anywhere.
                            </p>

                            <div className="flex gap-2">
                                <button type="button" onClick={closeKeyModal} className="flex-1 rounded-lg border border-gray-200 p-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingKey || !apiKeyInput.trim()}
                                    onClick={handleSaveKey}
                                    className="flex-1 rounded-lg border border-gray-900 bg-gray-900 p-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isSavingKey ? 'Saving…' : 'Save & Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
