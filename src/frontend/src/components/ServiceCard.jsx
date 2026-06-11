import React from 'react';

const ICONS = {
    "code_review": "🔍",
    "essay_writer": "✍️",
    "data_analyst": "📊"
};

const ServiceCard = ({ service, onSelect }) => {
    const icon = ICONS[service.id] || "✨";
    return (
        <div className="bg-algo-card border border-algo-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-algo-blue/30 transition-all flex flex-col h-full group">
            <div className="flex items-center space-x-3 mb-4">
                <span className="text-4xl">{icon}</span>
                <h3 className="text-2xl font-bold text-white group-hover:text-algo-blue transition-colors">{service.name}</h3>
            </div>
            
            <p className="text-gray-400 mb-6 flex-grow leading-relaxed">
                {service.description}
            </p>
            
            <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Example Prompt</span>
                <p className="text-sm text-gray-300 font-mono line-clamp-2">"{service.example_prompt}"</p>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
                <div>
                    <div className="text-sm text-gray-500 font-medium">Price per request</div>
                    <span className="text-xl font-bold text-algo-blue">{service.price_algo > 0 ? `${service.price_algo} ALGO` : 'Token-Based'}</span>
                </div>
                
                <button 
                    onClick={() => onSelect(service)}
                    className="bg-algo-blue hover:bg-blue-400 text-algo-dark px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-algo-blue/20"
                >
                    Buy Access
                </button>
            </div>
        </div>
    );
};

export default ServiceCard;
