import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAgentDetails, chatWithAgent, submitAgentReview, getAgentReviews } from '../api/client';

const CATEGORY_EMOJIS = { coding:'💻', business:'📊', marketing:'📣', legal:'⚖️', education:'📚', productivity:'⚡', content_creation:'✍️', data_analysis:'📈', creative:'🎨', general:'🌐' };

export default function AgentDetailPage() {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');

    const [agent, setAgent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Chat state
    const [isChatting, setIsChatting] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    
    // Review state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    useEffect(() => { if (agentId) loadData(); }, [agentId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [a, r] = await Promise.all([
                getAgentDetails(agentId),
                getAgentReviews(agentId).catch(() => ({ reviews: [] }))
            ]);
            setAgent(a);
            setReviews(r.reviews || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || !wallet || isStreaming) return;

        const userMsg = prompt.trim();
        setPrompt('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsStreaming(true);
        setIsChatting(true);

        try {
            const res = await chatWithAgent(agentId, wallet, userMsg);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'text') {
                                setChatHistory(prev => {
                                    const newHistory = [...prev];
                                    newHistory[newHistory.length - 1].content += data.content;
                                    return newHistory;
                                });
                            } else if (data.type === 'error') {
                                console.error('Stream error:', data.message);
                            }
                        } catch (err) { console.error('Parse error', err); }
                    }
                }
            }
        } catch (e) {
            alert(`Chat failed: ${e.message}`);
        }
        setIsStreaming(false);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!wallet) return alert("Please connect wallet first");
        try {
            await submitAgentReview(agentId, wallet, rating, reviewText);
            setShowReviewForm(false);
            setRating(5);
            setReviewText('');
            loadData();
        } catch (e) { alert(e.message); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="text-4xl animate-bounce">🤖</div>
        </div>
    );

    if (!agent) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">❌</div>
                <h2 className="text-xl font-black">Agent not found</h2>
                <button onClick={() => navigate('/dashboard/marketplace')} className="mt-4 rounded-xl border-2 border-[#111] bg-cyan-300 px-5 py-2 font-black shadow-[3px_3px_0px_#111]">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/dashboard/marketplace')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-4 flex items-center gap-1">← Back to Marketplace</button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Agent Card */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111]">
                            <div className="w-16 h-16 rounded-xl border-4 border-[#111] bg-purple-200 flex items-center justify-center text-3xl shadow-[4px_4px_0px_#111] mb-4">
                                {CATEGORY_EMOJIS[agent.category] || '🤖'}
                            </div>
                            <h1 className="text-2xl font-black mb-1">{agent.name}</h1>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="rounded-full border-2 border-[#111] bg-purple-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">{agent.category?.replace('_', ' ')}</span>
                                {agent.avg_rating > 0 && <span className="text-sm font-black">⭐ {agent.avg_rating.toFixed(1)} ({agent.review_count})</span>}
                            </div>
                            <p className="font-bold opacity-70 mb-4">{agent.description}</p>
                            
                            <div className="space-y-3 pt-4 border-t-2 border-[#111]">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Creator</p>
                                    <button onClick={() => navigate(`/creator/${agent.creator_wallet}`)} className="text-sm font-black hover:text-purple-600 transition-colors">{agent.creator_name}</button>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Model Config</p>
                                    <p className="text-sm font-bold">{agent.provider} / {agent.model}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Pricing</p>
                                    <p className="text-sm font-bold">{agent.pricing_model === 'per_request' ? `${(agent.price_per_request_microalgo / 1_000_000).toFixed(4)} ALGO / request` : 'Per Token'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Usage Stats */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-5 shadow-[6px_6px_0px_#111]">
                            <h3 className="font-black mb-3">📈 Usage Stats</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border-2 border-[#111] bg-green-100 p-2 text-center">
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Uses</p>
                                    <p className="text-lg font-black">{agent.usage_stats?.total_uses || 0}</p>
                                </div>
                                <div className="rounded-xl border-2 border-[#111] bg-orange-100 p-2 text-center">
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Users</p>
                                    <p className="text-lg font-black">{agent.usage_stats?.unique_users || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Chat & Reviews */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Chat Interface */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111] flex flex-col h-[500px]">
                            <h2 className="text-xl font-black mb-4 flex items-center justify-between">
                                <span>💬 Try this Agent</span>
                                {!wallet && <span className="text-xs font-bold text-red-500">Connect wallet to chat</span>}
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto mb-4 border-2 border-[#111] rounded-xl p-4 bg-gray-50">
                                {chatHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <div className="text-4xl mb-2">👋</div>
                                        <p className="font-black">Say hi to {agent.name}!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-xl border-2 border-[#111] p-3 shadow-[2px_2px_0px_#111] ${msg.role === 'user' ? 'bg-purple-200' : 'bg-white'}`}>
                                                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleChatSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={!wallet || isStreaming}
                                    className="flex-1 rounded-xl border-2 border-[#111] px-4 py-2 font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-100 disabled:opacity-50"
                                />
                                <button type="submit" disabled={!wallet || isStreaming || !prompt.trim()} className="rounded-xl border-2 border-[#111] bg-cyan-300 px-6 py-2 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all">
                                    {isStreaming ? '...' : 'Send'}
                                </button>
                            </form>
                        </div>

                        {/* Reviews Section */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black">⭐ Reviews</h2>
                                {wallet && (
                                    <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-sm font-black underline">
                                        {showReviewForm ? 'Cancel' : 'Write a Review'}
                                    </button>
                                )}
                            </div>

                            {showReviewForm && (
                                <form onSubmit={handleSubmitReview} className="mb-6 rounded-xl border-2 border-[#111] p-4 bg-yellow-50">
                                    <div className="mb-3">
                                        <label className="block text-sm font-black mb-1">Rating</label>
                                        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border-2 border-[#111] px-3 py-2 font-bold outline-none">
                                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm font-black mb-1">Review</label>
                                        <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="w-full h-20 resize-none rounded-xl border-2 border-[#111] p-3 font-bold outline-none" placeholder="What do you think?" />
                                    </div>
                                    <button type="submit" className="rounded-xl border-2 border-[#111] bg-green-300 px-5 py-2 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 transition-all">Submit Review</button>
                                </form>
                            )}

                            {reviews.length === 0 ? (
                                <p className="text-sm font-bold opacity-60 text-center py-4">No reviews yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map(r => (
                                        <div key={r.id} className="border-b-2 border-gray-100 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-black text-sm">{r.user_name || 'Anonymous'}</span>
                                                <span className="text-yellow-500 font-black">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                                            </div>
                                            {r.review_text && <p className="text-sm font-bold opacity-80">{r.review_text}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
