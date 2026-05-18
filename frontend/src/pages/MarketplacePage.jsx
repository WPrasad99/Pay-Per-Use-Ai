import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Terminal, 
    Briefcase, 
    Megaphone, 
    Scale, 
    GraduationCap, 
    Zap, 
    PenTool, 
    TrendingUp, 
    Palette, 
    Globe,
    Search,
    ArrowLeft,
    Sparkles,
    Flame,
    Star,
    User,
    Cpu,
    BookOpen
} from 'lucide-react';
import { browseMarketplace, getTrendingAgents, getCategories } from '../api/client';

const CATEGORY_ICONS = {
    coding: Terminal,
    business: Briefcase,
    marketing: Megaphone,
    legal: Scale,
    education: GraduationCap,
    productivity: Zap,
    content_creation: PenTool,
    data_analysis: TrendingUp,
    creative: Palette,
    general: Globe,
};

const CATEGORY_COLORS = {
    coding: { bg: 'bg-green-100 text-green-700 border-green-300', tag: 'bg-green-50 text-green-700 border-green-200' },
    business: { bg: 'bg-yellow-100 text-yellow-700 border-yellow-300', tag: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    marketing: { bg: 'bg-pink-100 text-pink-700 border-pink-300', tag: 'bg-pink-50 text-pink-700 border-pink-200' },
    legal: { bg: 'bg-red-100 text-red-700 border-red-300', tag: 'bg-red-50 text-red-700 border-red-200' },
    education: { bg: 'bg-blue-100 text-blue-700 border-blue-300', tag: 'bg-blue-50 text-blue-700 border-blue-200' },
    productivity: { bg: 'bg-amber-100 text-amber-700 border-amber-300', tag: 'bg-amber-50 text-amber-700 border-amber-200' },
    content_creation: { bg: 'bg-orange-100 text-orange-700 border-orange-300', tag: 'bg-orange-50 text-orange-700 border-orange-200' },
    data_analysis: { bg: 'bg-teal-100 text-teal-700 border-teal-300', tag: 'bg-teal-50 text-teal-700 border-teal-200' },
    creative: { bg: 'bg-purple-100 text-purple-700 border-purple-300', tag: 'bg-purple-50 text-purple-700 border-purple-200' },
    general: { bg: 'bg-slate-100 text-slate-700 border-slate-300', tag: 'bg-slate-50 text-slate-700 border-slate-200' }
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
        } catch (e) { 
            console.error('Failed to load marketplace:', e); 
        }
        setLoading(false);
    };

    const handleSearch = (e) => { 
        e.preventDefault(); 
        loadData(); 
    };

    const displayAgents = tab === 'trending' ? trending : agents;

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8 flex items-start justify-center">
            <div className="max-w-7xl w-full">
                
                {/* HEADER ROW */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <div>
                        <button 
                            onClick={() => navigate('/dashboard')} 
                            className="text-sm font-black text-black opacity-60 hover:opacity-100 mb-3 flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4 text-black" /> Back to Workspace
                        </button>
                        
                        <h1 className="text-3xl md:text-5xl font-black text-black flex items-center gap-3">
                            <Cpu className="w-10 h-10 text-purple-600 animate-pulse stroke-[2.5]" /> AI Marketplace
                        </h1>
                        <p className="font-bold text-neo-muted mt-1 opacity-70 ml-1">
                            Discover and leverage customizable AI agents in a pay-per-use marketplace.
                        </p>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/dashboard/create-agent')} 
                        className="rounded-xl border-4 border-black bg-purple-300 px-6 py-3.5 font-black shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#000] transition-all flex items-center gap-2 text-black cursor-pointer"
                    >
                        <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
                        Create AI Agent
                    </motion.button>
                </div>

                {/* SEARCH & FILTERS DOCK */}
                <div className="rounded-2xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_#000] mb-8">
                    <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-muted opacity-50 stroke-[2.5]" />
                            <input 
                                type="text" 
                                placeholder="Search AI agents by name, tag, or provider..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full rounded-xl border-2 border-black pl-11 pr-4 py-3 font-bold shadow-[3px_3px_0px_#000] bg-white text-black outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_#000] transition-all" 
                            />
                        </div>
                        <motion.button 
                            type="submit" 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-xl border-2 border-black bg-cyan-300 px-6 py-3 font-black shadow-[3px_3px_0px_#000] active:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <Search className="w-5 h-5 text-black stroke-[3]" />
                        </motion.button>
                    </form>

                    {/* CATEGORY CHIPS */}
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setSelectedCategory('all')} 
                            className={`rounded-full border-2 border-black px-4 py-1.5 text-xs font-black shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
                                selectedCategory === 'all' 
                                ? 'bg-black text-white' 
                                : 'bg-white text-black'
                            }`}
                        >
                            <Globe className="w-3.5 h-3.5" /> All
                        </button>
                        
                        {categories.map(cat => {
                            const IconComponent = CATEGORY_ICONS[cat] || Globe;
                            const isSelected = selectedCategory === cat;
                            return (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)} 
                                    className={`rounded-full border-2 border-black px-4 py-1.5 text-xs font-black shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] transition-all hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer ${
                                        isSelected 
                                        ? 'bg-black text-white' 
                                        : 'bg-white text-black'
                                    }`}
                                >
                                    <IconComponent className="w-3.5 h-3.5" />
                                    {cat.replace(/_/g, ' ')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TABS + SORT DECK */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex gap-2">
                        {['browse', 'trending'].map(t => {
                            const isSelected = tab === t;
                            return (
                                <button 
                                    key={t} 
                                    onClick={() => setTab(t)} 
                                    className={`rounded-xl border-2 border-black px-5 py-2.5 text-sm font-black shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 ${
                                        isSelected 
                                        ? 'bg-black text-white' 
                                        : 'bg-white text-black'
                                    }`}
                                >
                                    {t === 'browse' ? <BookOpen className="w-4 h-4" /> : <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />}
                                    {t === 'browse' ? 'Browse' : 'Trending'}
                                </button>
                            );
                        })}
                    </div>

                    {tab === 'browse' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-black">Sort:</span>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)} 
                                className="rounded-xl border-2 border-black px-4 py-2.5 text-sm font-black shadow-[3px_3px_0px_#000] outline-none bg-white text-black cursor-pointer focus:bg-yellow-50 transition-all"
                            >
                                <option value="created_at">Newest</option>
                                <option value="total_uses">Most Used</option>
                                <option value="avg_rating">Top Rated</option>
                                <option value="price">Lowest Price</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* MAIN GRID */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="rounded-2xl border-4 border-black bg-white p-8 shadow-[6px_6px_0px_#000] text-center">
                            <Cpu className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-3 stroke-[2.5]" />
                            <p className="font-black text-black">Scanning the marketplace...</p>
                        </div>
                    </div>
                ) : displayAgents.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="rounded-2xl border-4 border-black bg-white p-8 shadow-[6px_6px_0px_#000] text-center max-w-md">
                            <div className="text-5xl mb-4">🏗️</div>
                            <h3 className="text-xl font-black mb-2 text-black">No agents found</h3>
                            <p className="font-bold text-neo-muted mb-6">
                                Be the pioneer! Deploy your custom AI agent and monetize its intelligence.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/dashboard/create-agent')} 
                                className="rounded-xl border-2 border-black bg-purple-300 px-6 py-3 font-black shadow-[4px_4px_0px_#000] hover:shadow-[5px_5px_0px_#000] transition-all cursor-pointer text-black"
                            >
                                ✨ Create Agent
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayAgents.map((agent, i) => {
                            const colors = CATEGORY_COLORS[agent.category] || CATEGORY_COLORS.general;
                            const CardIcon = CATEGORY_ICONS[agent.category] || Cpu;
                            
                            return (
                                <motion.div
                                    key={agent.agent_id}
                                    whileHover={{ y: -6, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/dashboard/${agent.agent_id}`)}
                                    className="rounded-2xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#000] cursor-pointer transition-all duration-200 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Card Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl border-2 border-black ${colors.bg} flex items-center justify-center shadow-[2px_2px_0px_#000]`}>
                                                    <CardIcon className="w-6 h-6 stroke-[2.5]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-base leading-tight text-black truncate max-w-[150px] md:max-w-[170px]">{agent.name}</h3>
                                                    <p className="text-[10px] font-bold text-neo-muted opacity-60 uppercase tracking-tight mt-0.5">
                                                        {agent.provider} · {agent.model}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {agent.avg_rating > 0 && (
                                                <span className="rounded-lg border-2 border-black bg-yellow-200 px-2 py-0.5 text-xs font-black shadow-[2px_2px_0px_#000] flex items-center gap-1 text-black">
                                                    <Star className="w-3.5 h-3.5 text-black fill-yellow-400" /> 
                                                    {agent.avg_rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Description */}
                                        <p className="text-sm font-bold text-neo-muted opacity-80 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
                                            {agent.description}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        {/* Category Tag */}
                                        <span className={`rounded-full border-2 border-black ${colors.tag} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider`}>
                                            {agent.category?.replace(/_/g, ' ')}
                                        </span>
                                        
                                        {/* Footer Details */}
                                        <div className="flex items-center justify-between pt-3 mt-4 border-t-2 border-black">
                                            <div className="flex items-center gap-3 text-[11px] font-black opacity-60 text-black">
                                                <span className="flex items-center gap-1.5">
                                                    <User className="w-3.5 h-3.5 text-black opacity-70" /> 
                                                    {agent.creator_name || 'Creator'}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> 
                                                    {agent.total_uses || 0} uses
                                                </span>
                                            </div>
                                            
                                            <span className="rounded-lg border-2 border-black bg-green-200 px-2.5 py-1 text-[11px] font-black shadow-[2px_2px_0px_#000] text-black">
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
