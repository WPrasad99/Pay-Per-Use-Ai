import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const result = location.state?.result;

    if (!result) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="text-center">
                    <p className="text-xl text-gray-400 font-medium mb-6">No active result found.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-16 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="glass-card rounded-2xl p-8 glow-purple">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <span className="text-green-400 text-lg">✓</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Response Ready</h2>
                            <p className="text-xs text-gray-500">Payment verified on Algorand Testnet</p>
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                        <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">
                            {result.ai_response}
                        </pre>
                    </div>

                    <div className="mt-6 text-center">
                        <button onClick={() => navigate('/services')} className="btn-primary">
                            Use Another Service →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
