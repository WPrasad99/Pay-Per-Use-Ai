import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { browseMarketplace, getTrendingAgents, getCategories } from '../api/client';

const CATEGORY_EMOJIS = {
    coding: '💻', business: '📊', marketing: '📣', legal: '⚖️',
    education: '📚', productivity: '⚡', content_creation: '✍️',
    data_analysis: '📈', creative: '🎨', general: '🌐',
};

export default function MarketplacePage() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [trending, setTrending] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('browse');

    useEffect(() => { loadData(); }, [selectedCategory, sortBy]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [agentsRes, trendingRes, catsRes] = await Promise.all([
                browseMarketplace({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchQuery || undefined, sort_by: sortBy }),
                getTrendingAgents(),
                getCategories(),
            ]);
            setAgents(agentsRes.agents || []);
            setTrending(trendingRes.agents || []);
            setCategories(catsRes.categories || []);
        } catch (e) { console.error('Failed to load marketplace:', e); }
        setLoading(false);
    };

    const handleSearch = (e) => { e.preventDefault(); loadData(); };
    const displayAgents = tab === 'trending' ? trending : agents;

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-2 flex items-center gap-1">← Back to Workspace</button>
                        <h1 className="text-3xl md:text-4xl font-black">🤖 AI Marketplace</h1>
                        <p className="font-bold opacity-60 mt-1">Discover and use AI agents created by the community</p>
                    </div>
                    <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-4 border-[#111] bg-purple-300 px-6 py-3 font-black shadow-[6px_6px_0px_#111] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#111] active:translate-y-0 active:shadow-[2px_2px_0px_#111] flex items-center gap-2">
                        ✨ Create AI Agent
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="rounded-2xl border-4 border-[#111] bg-white p-4 shadow-[6px_6px_0px_#111] mb-6">
                    <form onSubmit={handleSearch} className="flex gap-3 mb-4">
                        <input type="text" placeholder="Search AI agents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 rounded-xl border-2 border-[#111] px-4 py-2.5 font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-100 transition-all" />
                        <button type="submit" className="rounded-xl border-2 border-[#111] bg-cyan-300 px-5 py-2.5 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">🔍</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelectedCategory('all')} className={`rounded-full border-2 border-[#111] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-0.5 ${selectedCategory === 'all' ? 'bg-[#111] text-white' : 'bg-white'}`}>All</button>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`rounded-full border-2 border-[#111] px-3 py-1 text-xs font-black shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-0.5 ${selectedCategory === cat ? 'bg-[#111] text-white' : 'bg-white'}`}>
                                {CATEGORY_EMOJIS[cat] || '🌐'} {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs + Sort */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        {['browse', 'trending'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`rounded-xl border-2 border-[#111] px-4 py-2 text-sm font-black shadow-[3px_3px_0px_#111] transition-all ${tab === t ? 'bg-[#111] text-white' : 'bg-white hover:-translate-y-0.5'}`}>
                                {t === 'browse' ? '🛒 Browse' : '🔥 Trending'}
                            </button>
                        ))}
                    </div>
                    {tab === 'browse' && (
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border-2 border-[#111] px-3 py-2 text-sm font-bold shadow-[3px_3px_0px_#111] outline-none bg-white">
                            <option value="created_at">Newest</option>
                            <option value="total_uses">Most Used</option>
                            <option value="avg_rating">Top Rated</option>
                            <option value="price">Lowest Price</option>
                        </select>
                    )}
                </div>

                {/* Agent Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center"><div className="text-4xl animate-bounce mb-3">🤖</div><p className="font-black">Loading agents...</p></div></div>
                ) : displayAgents.length === 0 ? (
                    <div className="flex items-center justify-center py-20"><div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center max-w-md"><div className="text-5xl mb-4">🏗️</div><h3 className="text-xl font-black mb-2">No agents yet</h3><p className="font-bold opacity-60 mb-4">Be the first to create an AI agent!</p><button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-2 border-[#111] bg-purple-300 px-5 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 transition-all">✨ Create Agent</button></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayAgents.map((agent, i) => (
                            <div key={agent.agent_id} onClick={() => navigate(`/dashboard/${agent.agent_id}`)} className="rounded-2xl border-4 border-[#111] bg-white p-5 shadow-[6px_6px_0px_#111] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#5f4bff] animate-soft-rise" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl border-2 border-[#111] bg-purple-100 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#111]">{CATEGORY_EMOJIS[agent.category] || '🤖'}</div>
                                        <div><h3 className="font-black text-base leading-tight">{agent.name}</h3><p className="text-[11px] font-bold opacity-50">{agent.provider} · {agent.model}</p></div>
                                    </div>
                                    {agent.avg_rating > 0 && <span className="rounded-lg border-2 border-[#111] bg-yellow-200 px-2 py-0.5 text-xs font-black shadow-[2px_2px_0px_#111]">⭐ {agent.avg_rating.toFixed(1)}</span>}
                                </div>
                                <p className="text-sm font-bold opacity-70 mb-3 line-clamp-2">{agent.description}</p>
                                <span className="rounded-full border-2 border-[#111] bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{agent.category?.replace('_', ' ')}</span>
                                <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-[#111]">
                                    <div className="flex items-center gap-3 text-[11px] font-black opacity-60"><span>👤 {agent.creator_name || 'Creator'}</span><span>🔥 {agent.total_uses || 0} uses</span></div>
                                    <span className="rounded-lg border-2 border-[#111] bg-green-200 px-2 py-0.5 text-[11px] font-black shadow-[2px_2px_0px_#111]">{agent.pricing_model === 'per_request' ? `${(agent.price_per_request_microalgo / 1_000_000).toFixed(2)} ALGO` : 'Per token'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
