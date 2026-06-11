import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Terminal, Briefcase, Megaphone, Scale, GraduationCap, Zap,
    PenTool, TrendingUp, Palette, Globe, Search, ArrowLeft,
    Plus, Flame, Star, User, Cpu, BookOpen, ChevronDown
} from 'lucide-react';
import { browseMarketplace, getTrendingAgents, getCategories } from '../api/client';

const CATEGORY_ICONS = {
    coding: Terminal, business: Briefcase, marketing: Megaphone, legal: Scale,
    education: GraduationCap, productivity: Zap, content_creation: PenTool,
    data_analysis: TrendingUp, creative: Palette, general: Globe,
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
                browseMarketplace({ 
                    category: selectedCategory !== 'all' ? selectedCategory : undefined, 
                    search: searchQuery || undefined, 
                    sort_by: sortBy 
                }),
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
        <div className="min-h-screen bg-white font-sans">
            {/* Top Header */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="h-4 w-px bg-gray-200" />
                        <h1 className="text-[15px] font-semibold text-gray-900">AI Marketplace</h1>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/create-agent')} 
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Agent
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Browse AI Agents</h2>
                    <p className="text-[14px] text-gray-500">Discover and use customizable AI agents on a pay-per-use basis.</p>
                </div>

                {/* Search + Sort Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search agents…" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-[14px] text-gray-800 outline-none focus:border-gray-400 bg-white transition-colors" 
                        />
                    </form>
                    <div className="flex items-center gap-3">
                        {/* Tabs */}
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                            {['browse', 'trending'].map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setTab(t)} 
                                    className={`px-3.5 py-2 text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
                                        tab === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {t === 'trending' && <Flame className="w-3.5 h-3.5" />}
                                    {t === 'browse' ? 'Browse' : 'Trending'}
                                </button>
                            ))}
                        </div>
                        {/* Sort */}
                        {tab === 'browse' && (
                            <div className="relative">
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)} 
                                    className="appearance-none rounded-lg border border-gray-200 pl-3 pr-8 py-2.5 text-[13px] text-gray-700 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
                                >
                                    <option value="created_at">Newest</option>
                                    <option value="total_uses">Most Used</option>
                                    <option value="avg_rating">Top Rated</option>
                                    <option value="price">Lowest Price</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <button 
                        onClick={() => setSelectedCategory('all')} 
                        className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition-colors ${
                            selectedCategory === 'all' 
                            ? 'bg-gray-900 text-white border-gray-900' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        All
                    </button>
                    {categories.map(cat => {
                        const IconComponent = CATEGORY_ICONS[cat] || Globe;
                        const isSelected = selectedCategory === cat;
                        return (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)} 
                                className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition-colors flex items-center gap-1.5 ${
                                    isSelected 
                                    ? 'bg-gray-900 text-white border-gray-900' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <IconComponent className="w-3 h-3" />
                                {cat.replace(/_/g, ' ')}
                            </button>
                        );
                    })}
                </div>

                {/* Agent Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[14px] text-gray-500">Loading agents…</p>
                        </div>
                    </div>
                ) : displayAgents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-12 h-12 rounded-2xl border border-gray-200 flex items-center justify-center mb-4">
                            <Cpu className="w-5 h-5 text-gray-400" />
                        </div>
                        <h3 className="text-[15px] font-semibold text-gray-800 mb-1">No agents found</h3>
                        <p className="text-[13px] text-gray-500 mb-6">Be the pioneer — deploy your custom AI agent and monetize it.</p>
                        <button 
                            onClick={() => navigate('/dashboard/create-agent')} 
                            className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Create Agent
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayAgents.map((agent) => {
                            const CardIcon = CATEGORY_ICONS[agent.category] || Cpu;
                            return (
                                <motion.div
                                    key={agent.agent_id}
                                    whileHover={{ y: -2 }}
                                    onClick={() => navigate(`/dashboard/${agent.agent_id}`)}
                                    className="rounded-2xl border border-gray-200 bg-white p-5 cursor-pointer hover:border-gray-300 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                                                    <CardIcon className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-[14px] text-gray-900 truncate max-w-[150px]">{agent.name}</h3>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{agent.provider} · {agent.model}</p>
                                                </div>
                                            </div>
                                            {agent.avg_rating > 0 && (
                                                <span className="flex items-center gap-1 text-[12px] font-medium text-gray-500">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {agent.avg_rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed min-h-[40px]">
                                            {agent.description}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="inline-block rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-500 capitalize mb-3">
                                            {agent.category?.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-3 text-[12px] text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    {agent.creator_name || 'Creator'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Flame className="w-3.5 h-3.5" />
                                                    {agent.total_uses || 0}
                                                </span>
                                            </div>
                                            <span className="rounded-full border border-gray-200 px-3 py-1 text-[13px] font-semibold text-gray-800">
                                                {agent.pricing_model === 'per_request' 
                                                    ? `${(agent.price_per_request_microalgo / 1_000_000).toFixed(2)} ALGO` 
                                                    : 'Per token'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
