import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/client';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const walletAddress = sessionStorage.getItem('wallet_address');
    
    const [formData, setFormData] = useState({ name: '', dob: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!walletAddress) {
            navigate('/');
        }
    }, [walletAddress, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await registerUser(walletAddress, formData.name, formData.dob, formData.email);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-20 pb-10 px-4">
            <div className="glass-card max-w-md w-full p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 glow-line"></div>
                <h2 className="text-3xl font-bold mb-2 text-white">Welcome to <span className="gradient-text">PayPerAI</span></h2>
                <p className="text-gray-400 mb-8">Let's personalize your experience. Please provide some details to get started.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input 
                            type="text" 
                            required
                            minLength={2}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="input-dark w-full"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                        <input 
                            type="date" 
                            required
                            value={formData.dob}
                            onChange={(e) => setFormData({...formData, dob: e.target.value})}
                            className="input-dark w-full text-gray-300"
                        />
                        <p className="text-xs text-gray-500 mt-1">You must be at least 18 years old.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="input-dark w-full"
                            placeholder="john@example.com"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Profile...' : 'Continue to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;
