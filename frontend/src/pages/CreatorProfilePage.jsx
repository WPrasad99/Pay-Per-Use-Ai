import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCreatorProfile, getCreatorAgents } from '../api/client';

const CATEGORY_EMOJIS = { coding:'💻', business:'📊', marketing:'📣', legal:'⚖️', education:'📚', productivity:'⚡', content_creation:'✍️', data_analysis:'📈', creative:'🎨', general:'🌐' };

export default function CreatorProfilePage() {
    const { wallet } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (wallet) loadProfile(); }, [wallet]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [p, a] = await Promise.all([
                getCreatorProfile(wallet),
                getCreatorAgents(wallet),
            ]);
            setProfile(p);
            setAgents(a.agents || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="text-4xl animate-bounce">👤</div>
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-xl font-black">Creator not found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 rounded-xl border-2 border-[#111] bg-cyan-300 px-5 py-2 font-black shadow-[3px_3px_0px_#111]">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate(-1)} className="text-sm font-bold opacity-60 hover:opacity-100 mb-4">← Back</button>

                {/* Profile Card */}
                <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111] mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl border-4 border-[#111] bg-purple-200 flex items-center justify-center text-4xl shadow-[4px_4px_0px_#111]">
                            {profile.display_name?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black">{profile.display_name}</h1>
                            <p className="text-xs font-bold opacity-50 mt-0.5 font-mono break-all">{profile.did}</p>
                            {profile.bio && <p className="text-sm font-bold opacity-70 mt-2">{profile.bio}</p>}
                            <div className="flex gap-3 mt-2">
                                {profile.social_twitter && <a href={`https://twitter.com/${profile.social_twitter}`} target="_blank" rel="noreferrer" className="text-xs font-black opacity-60 hover:opacity-100">🐦 {profile.social_twitter}</a>}
                                {profile.social_github && <a href={`https://github.com/${profile.social_github}`} target="_blank" rel="noreferrer" className="text-xs font-black opacity-60 hover:opacity-100">🐙 {profile.social_github}</a>}
                                {profile.social_website && <a href={profile.social_website} target="_blank" rel="noreferrer" className="text-xs font-black opacity-60 hover:opacity-100">🌐 Website</a>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="rounded-xl border-2 border-[#111] bg-green-100 p-3 text-center shadow-[2px_2px_0px_#111]">
                            <p className="text-xs font-black opacity-60">Agents</p>
                            <p className="text-xl font-black">{profile.total_agents || 0}</p>
                        </div>
                        <div className="rounded-xl border-2 border-[#111] bg-purple-100 p-3 text-center shadow-[2px_2px_0px_#111]">
                            <p className="text-xs font-black opacity-60">Earnings</p>
                            <p className="text-xl font-black">{((profile.total_earnings_microalgo || 0) / 1_000_000).toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border-2 border-[#111] bg-yellow-100 p-3 text-center shadow-[2px_2px_0px_#111]">
                            <p className="text-xs font-black opacity-60">Joined</p>
                            <p className="text-sm font-black">{new Date(profile.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Published Agents */}
                <h2 className="text-xl font-black mb-4">🤖 Published Agents</h2>
                {agents.length === 0 ? (
                    <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                        <p className="font-bold opacity-60">This creator hasn't published any agents yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agents.filter(a => a.is_active).map(agent => (
                            <div key={agent.agent_id} onClick={() => navigate(`/dashboard/${agent.agent_id}`)} className="rounded-2xl border-4 border-[#111] bg-white p-5 shadow-[6px_6px_0px_#111] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_#5f4bff]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl border-2 border-[#111] bg-purple-100 flex items-center justify-center text-xl shadow-[2px_2px_0px_#111]">{CATEGORY_EMOJIS[agent.category] || '🤖'}</div>
                                    <div><h3 className="font-black">{agent.name}</h3><p className="text-[11px] font-bold opacity-50">{agent.provider} · {agent.model}</p></div>
                                </div>
                                <p className="text-sm font-bold opacity-70 line-clamp-2">{agent.description}</p>
                                <div className="flex items-center gap-3 mt-3 text-xs font-black opacity-50">
                                    <span>🔥 {agent.total_uses || 0} uses</span>
                                    <span>⭐ {agent.avg_rating > 0 ? agent.avg_rating.toFixed(1) : 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
