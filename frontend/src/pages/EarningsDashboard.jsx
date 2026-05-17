import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorEarnings, getCreatorAnalytics, getCreatorProfile } from '../api/client';

export default function EarningsDashboard() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');
    const [profile, setProfile] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (wallet) loadData(); }, [wallet]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, e, a] = await Promise.all([
                getCreatorProfile(wallet).catch(() => null),
                getCreatorEarnings(wallet).catch(() => ({ summary: {}, history: [] })),
                getCreatorAnalytics(wallet).catch(() => ({ analytics: {} })),
            ]);
            setProfile(p);
            setEarnings(e);
            setAnalytics(a);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    if (!wallet) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-xl font-black">Connect Wallet</h2>
            </div>
        </div>
    );

    const summary = earnings?.summary || {};
    const history = earnings?.history || [];
    const stats = analytics?.analytics || {};
    const totalEarned = (summary.total_earned_microalgo || 0) / 1_000_000;
    const totalWithdrawn = (summary.total_withdrawn_microalgo || 0) / 1_000_000;
    const available = (summary.available_microalgo || 0) / 1_000_000;

    const statCards = [
        { label: 'Available', value: `${available.toFixed(4)} ALGO`, color: 'bg-green-200', icon: '💰' },
        { label: 'Lifetime Earned', value: `${totalEarned.toFixed(4)} ALGO`, color: 'bg-purple-200', icon: '📈' },
        { label: 'Total Withdrawn', value: `${totalWithdrawn.toFixed(4)} ALGO`, color: 'bg-cyan-200', icon: '🏦' },
        { label: 'Total Users', value: stats.unique_users || 0, color: 'bg-yellow-200', icon: '👥' },
        { label: 'Total Prompts', value: stats.total_uses || 0, color: 'bg-pink-200', icon: '💬' },
        { label: 'Tokens Served', value: (stats.total_tokens || 0).toLocaleString(), color: 'bg-orange-200', icon: '🔤' },
    ];

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-2">← Back</button>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black">💰 Earnings Dashboard</h1>
                        {profile && <p className="font-bold opacity-60 mt-1">DID: {profile.did}</p>}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20"><div className="text-4xl animate-bounce mb-3">💰</div><p className="font-black">Loading...</p></div>
                ) : !profile ? (
                    <div className="rounded-2xl border-4 border-[#111] bg-white p-10 shadow-[6px_6px_0px_#111] text-center">
                        <div className="text-5xl mb-4">👤</div>
                        <h3 className="text-xl font-black mb-2">No Creator Profile</h3>
                        <p className="font-bold opacity-60 mb-4">Create a creator profile first to start earning</p>
                        <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-2 border-[#111] bg-purple-300 px-5 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 transition-all">✨ Become a Creator</button>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {statCards.map((card, i) => (
                                <div key={card.label} className={`rounded-2xl border-4 border-[#111] ${card.color} p-5 shadow-[6px_6px_0px_#111] animate-soft-rise`} style={{ animationDelay: `${i * 80}ms` }}>
                                    <div className="text-2xl mb-2">{card.icon}</div>
                                    <p className="text-xs font-black uppercase tracking-wider opacity-60">{card.label}</p>
                                    <p className="text-xl font-black mt-1">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Earnings History */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111]">
                            <h2 className="text-lg font-black mb-4">📜 Earnings History</h2>
                            {history.length === 0 ? (
                                <p className="text-sm font-bold opacity-60 text-center py-8">No earnings yet. Publish agents and start earning!</p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {history.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-xl border-2 border-[#111] p-3 shadow-[2px_2px_0px_#111]">
                                            <div>
                                                <span className={`inline-block rounded-full border-2 border-[#111] px-2 py-0.5 text-[10px] font-black mr-2 ${item.tx_type === 'earning' ? 'bg-green-200' : 'bg-orange-200'}`}>
                                                    {item.tx_type === 'earning' ? '💰 Earned' : '🏦 Withdrawn'}
                                                </span>
                                                <span className="text-sm font-bold opacity-60">{item.agent_name || 'Agent'}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm">{(item.amount_microalgo / 1_000_000).toFixed(6)} ALGO</p>
                                                <p className="text-[10px] font-bold opacity-40">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
