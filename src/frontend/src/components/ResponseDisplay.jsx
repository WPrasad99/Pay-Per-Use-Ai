import React from 'react';

const ResponseDisplay = ({ result, onReset }) => {
    return (
        <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <h3 className="text-green-400 font-bold">Transaction Verified On-Chain</h3>
                        <p className="text-green-600/70 text-sm">Payment successfully routed through the smart contract.</p>
                    </div>
                </div>
            </div>

            <div className="bg-algo-card border border-algo-border rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                    <div>
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Service Used</span>
                        <span className="text-gray-200 font-bold">{result.service_used}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Tokens Consumed</span>
                        <span className="text-algo-blue font-mono">{result.tokens_used}</span>
                    </div>
                </div>
                
                <div className="p-8">
                    <pre className="whitespace-pre-wrap font-mono text-gray-300 text-sm leading-relaxed overflow-x-auto">
                        {result.ai_response}
                    </pre>
                </div>
                
                <div className="bg-gray-900/50 p-6 border-t border-gray-800">
                    <button 
                        onClick={onReset}
                        className="w-full md:w-auto px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-bold rounded-lg transition-colors mx-auto block"
                    >
                        Try Another Service
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResponseDisplay;
