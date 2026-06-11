import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedConversation } from '../api/client';

const SharedChatPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const walletAddress = sessionStorage.getItem('wallet_address');

    useEffect(() => {
        if (!walletAddress) {
            navigate('/', { state: { from: `/shared/${id}` } });
            return;
        }

        const fetchShared = async () => {
            try {
                const data = await getSharedConversation(id);
                setConversation(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchShared();
    }, [id, walletAddress, navigate]);

    if (!walletAddress) return null; // Handled by navigate
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-white">Loading shared conversation...</div>;
    if (error) return <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-8 bg-white text-black px-6 py-2 rounded-lg font-medium">Back to Dashboard</button>
    </div>;

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col">
            <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-bold gradient-text">PayPerUseAI</div>
                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                    <div className="text-sm font-medium text-gray-400">Shared Session: {conversation.service_id}</div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                    My Dashboard
                </button>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6 overflow-y-auto">
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-3xl font-bold mb-2">Public Conversation</h2>
                    <p className="text-gray-500 text-sm italic">This chat was shared via PayPerUseAI X402 protocol.</p>
                </div>

                {conversation.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-5 ${
                            msg.role === 'user' 
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' 
                            : 'bg-white/5 border border-white/10 text-gray-200'
                        }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                                    <span className="text-xs font-semibold text-purple-300">{conversation.service_id}</span>
                                </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                        </div>
                    </div>
                ))}
            </main>

            <footer className="p-8 text-center text-gray-600 text-xs border-t border-white/5 mt-auto">
                © 2024 PayPerUseAI. Secure X402 Algorand Payments.
            </footer>
        </div>
    );
};

export default SharedChatPage;
