import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { peraWallet } from '../config/peraWallet';
import { getUserProfile, getServices, getConversationHistory, sendChat, streamChat, getConversationMessages, getWalletPrepayBalance, depositWalletFunds, getPaymentInfo, deleteConversation, getUserAnalytics, getSessionStatus } from '../api/client';
import { useSiwa } from '../hooks/useSiwa';

const DashboardPage = () => {
    const navigate = useNavigate();
    const { signOut } = useSiwa();
    const walletAddress = sessionStorage.getItem('wallet_address');
    
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [activeService, setActiveService] = useState(null);
    const [history, setHistory] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [balance, setBalance] = useState(0);
    const [isDepositing, setIsDepositing] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState('');
    const [stats, setStats] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('none'); // 'none' | 'active' | 'expired'
    const [sessionCountdown, setSessionCountdown] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (!walletAddress) {
            navigate('/');
            return;
        }

        const initDashboard = async () => {
            try {
                // Fetch User Profile
                const profile = await getUserProfile(walletAddress);
                setUser(profile);

                // Fetch Services
                const srvs = await getServices();
                setServices(srvs);
                if (srvs.length > 0) setActiveService(srvs[0]);

                // Fetch History
                const hist = await getConversationHistory(walletAddress);
                setHistory(hist);

                // Fetch Balance
                const bal = await getWalletPrepayBalance(walletAddress);
                setBalance(bal.balance_algo);

                // Fetch Session Status
                try {
                    const sess = await getSessionStatus(walletAddress);
                    setSessionExpiry(sess.expiry_timestamp);
                    if (!sess.has_session) {
                        setSessionStatus('none');
                    } else if (sess.is_expired) {
                        setSessionStatus('expired');
                    } else {
                        setSessionStatus('active');
                    }
                } catch (_) { }

                // Fetch Analytics
                try {
                    const analytics = await getUserAnalytics(walletAddress);
                    setStats(analytics);
                } catch (_) { }

            } catch (err) {
                console.error("Dashboard init error:", err);
                if (err.message === "User not found") navigate('/onboarding');
                else if (err.message?.includes("Not authenticated")) {
                    // JWT cookie missing or expired ΓÇö redirect to home to re-authenticate
                    sessionStorage.clear();
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        initDashboard();
    }, [walletAddress, navigate]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Session countdown ticker
    useEffect(() => {
        if (sessionStatus !== 'active' || !sessionExpiry) return;
        const tick = () => {
            const secs = Math.max(0, sessionExpiry - Math.floor(Date.now() / 1000));
            if (secs === 0) { setSessionStatus('expired'); setSessionCountdown(''); return; }
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            setSessionCountdown(
                h > 0
                    ? `${h}h ${String(m).padStart(2,'0')}m`
                    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [sessionStatus, sessionExpiry]);

    const loadConversation = async (convId, srvId) => {
        setChatLoading(true);
        setActiveConversationId(convId);
        const srv = services.find(s => s.id === srvId);
        if (srv) setActiveService(srv);
        
        try {
            const data = await getConversationMessages(walletAddress, convId);
            setMessages(data.messages);
            setIsSidebarOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setChatLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        setInput('');
        setIsSidebarOpen(false);
    };

    const executeSend = async (promptText) => {
        const userMsg = { role: 'user', content: promptText };
        setMessages(prev => [...prev, userMsg]);
        // Add a placeholder for the streaming AI response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        setChatLoading(true);

        try {
            const res = await streamChat(
                activeService.id,
                walletAddress,
                promptText,
                activeConversationId
            );

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    const chunkStr = decoder.decode(value, { stream: true });
                    const lines = chunkStr.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.chunk) {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const lastIdx = newMsgs.length - 1;
                                        newMsgs[lastIdx] = {
                                            ...newMsgs[lastIdx],
                                            content: newMsgs[lastIdx].content + data.chunk
                                        };
                                        return newMsgs;
                                    });
                                } else if (data.done) {
                                    setActiveConversationId(data.conversation_id);
                                    setMessages(data.messages);
                                    
                                    // Refresh balance & history
                                    const bal = await getWalletPrepayBalance(walletAddress);
                                    setBalance(bal.balance_algo);
                                    const hist = await getConversationHistory(walletAddress);
                                    setHistory(hist);
                                    try {
                                        const analytics = await getUserAnalytics(walletAddress);
                                        setStats(analytics);
                                    } catch (_) { }
                                } else if (data.error) {
                                    setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${data.error}` }]);
                                }
                            } catch (e) {
                                // Ignore incomplete chunks
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err.message || '';
            // Auto-open the auth modal for session errors instead of showing in chat
            if (msg.includes('SESSION_EXPIRED') || msg.includes('NO_SESSION') || msg.includes('SESSION_AUTH_FAILED')) {
                const isExpired = msg.includes('SESSION_EXPIRED');
                setSessionStatus(isExpired ? 'expired' : 'none');
                setPendingPrompt(promptText);
                setMessages(prev => prev.slice(0, -1)); // remove the empty placeholder
                setIsAuthModalOpen(true);
            } else {
                setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `Error: ${err.message}` }]);
            }
        } finally {
            setChatLoading(false);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || !activeService) return;

        const currentInput = input;
        setInput('');

        // X402 Authorization Check: If balance is insufficient for one interaction
        if (balance < 0.5) {
            setPendingPrompt(currentInput);
            setIsAuthModalOpen(true);
            return;
        }

        await executeSend(currentInput);
    };

    const handleAuthorizeSession = async () => {
        try {
            if (!activeService) return;
            setIsDepositing(true);

            const algosdk = (await import('algosdk')).default;
            const ALGOD_API = 'https://testnet-api.algonode.cloud';

            const pw = peraWallet;
            let accounts = [];
            try { accounts = await pw.reconnectSession(); } catch (_) { }
            if (!accounts || !accounts.length) accounts = await pw.connect();
            if (accounts[0] !== walletAddress) throw new Error('Wallet mismatch.');

            const paymentInfo = await getPaymentInfo(activeService.id);
            const algodClient = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await algodClient.getTransactionParams().do();

            const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

            // If the user already has enough balance, only send start_session (no deposit needed)
            const hasSufficientBalance = balance >= 0.5; // balance is in ALGO

            // Read the real on-chain escrow balance (microALGO) to use as max_spend.
            // The contract asserts: escrow_balance >= max_spend, so we must not exceed it.
            let onChainBalanceMicro = Math.floor(balance * 1_000_000);
            try {
                const sess = await getSessionStatus(walletAddress);
                // session_balance_microalgo holds sb_ box, but we need the b_ (escrow) balance.
                // Use the backend wallet balance endpoint which reads the b_ box.
                const balData = await getWalletPrepayBalance(walletAddress);
                onChainBalanceMicro = balData.balance_microalgo || Math.floor(balance * 1_000_000);
            } catch (_) { }

            // When depositing, after the deposit lands the escrow will be current + 5 ALGO
            const depositAmountMicro = 5_000_000;
            const maxSpend = hasSufficientBalance
                ? onChainBalanceMicro          // renew only ΓÇö use existing escrow
                : onChainBalanceMicro + depositAmountMicro; // deposit + session

            const sessionMethod = new algosdk.ABIMethod({
                name: 'start_session',
                args: [{ type: 'uint64', name: 'max_spend' }, { type: 'uint64', name: 'expiry_time' }],
                returns: { type: 'bool' }
            });

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({
                addr: walletAddress, sk: new Uint8Array(64)
            });

            const atc = new algosdk.AtomicTransactionComposer();

            if (!hasSufficientBalance) {
                // Full flow: deposit 5 ALGO + start_session
                const amount = 5.0;
                const toAddr = paymentInfo.contract_address;
                const amountMicro = Math.floor(amount * 1_000_000);

                const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    sender: walletAddress, receiver: toAddr, amount: amountMicro, suggestedParams: params,
                });
                const depositMethod = new algosdk.ABIMethod({
                    name: 'deposit',
                    args: [{ type: 'pay', name: 'payment' }],
                    returns: { type: 'uint64' }
                });
                atc.addMethodCall({
                    appID: parseInt(paymentInfo.app_id),
                    method: depositMethod,
                    methodArgs: [{ txn: payTxn, signer: dummySigner }],
                    sender: walletAddress,
                    suggestedParams: params,
                    signer: dummySigner,
                    boxes: [{
                        appIndex: parseInt(paymentInfo.app_id),
                        name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(walletAddress).publicKey])
                    }]
                });
            }

            // Always add start_session
            atc.addMethodCall({
                appID: parseInt(paymentInfo.app_id),
                method: sessionMethod,
                methodArgs: [maxSpend, expiryTime],
                sender: walletAddress,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [
                    { appIndex: parseInt(paymentInfo.app_id), name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(walletAddress).publicKey]) },
                    { appIndex: parseInt(paymentInfo.app_id), name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(walletAddress).publicKey]) },
                    { appIndex: parseInt(paymentInfo.app_id), name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(walletAddress).publicKey]) }
                ]
            });

            const group = atc.buildGroup().map(t => t.txn);
            const txId = group[0].txID().toString();
            const signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [walletAddress] }))]);
            await algodClient.sendRawTransaction(signed).do();
            await algosdk.waitForConfirmation(algodClient, txId, 4);

            if (!hasSufficientBalance) {
                await depositWalletFunds(walletAddress, txId);
            }

            const bal = await getWalletPrepayBalance(walletAddress);
            setBalance(bal.balance_algo);
            setSessionExpiry(expiryTime);
            setSessionStatus('active');

            setIsAuthModalOpen(false);
            if (pendingPrompt) {
                await executeSend(pendingPrompt);
                setPendingPrompt('');
            }
        } catch (err) {
            console.error(err);
            alert('Authorization failed: ' + err.message);
        } finally {
            setIsDepositing(false);
        }
    };

    const handleShare = () => {
        if (!activeConversationId) {
            showToast('No conversation selected to share.', 'error');
            return;
        }
        const shareUrl = `${window.location.origin}/shared/${activeConversationId}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('Share link copied! (Viewers must be signed in)');
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    };

    const handleProfileClick = async () => {
        setIsProfileOpen(true);
        try {
            const analytics = await getUserAnalytics(walletAddress);
            setStats(analytics);
        } catch (err) { console.error(err); }
    };

    const handleDeleteConversation = (e, conversationId) => {
        e.stopPropagation();
        setConversationToDelete(conversationId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteConversation(conversationToDelete);
            setHistory(history.filter(h => h.conversation_id !== conversationToDelete));
            if (activeConversationId === conversationToDelete) {
                setMessages([]);
                setActiveConversationId(null);
            }
            setIsDeleteModalOpen(false);
            showToast('Conversation deleted.');
        } catch (err) {
            showToast('Failed to delete: ' + err.message, 'error');
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-transparent text-black">Loading...</div>;

    return (
        <div className="h-screen w-full flex bg-transparent text-[#0a0a0a] overflow-hidden font-sans">
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-4">
                    
                    {/* User Profile Area */}
                    <button onClick={handleProfileClick} className="w-full text-left flex items-center gap-3 p-3 mb-4 rounded-xl bg-black/5 border border-black/5 hover:bg-black/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-semibold text-sm truncate text-black">{user?.name}</h3>
                            <p className="text-xs text-gray-500 truncate">@{walletAddress.slice(0, 8)}...</p>
                        </div>
                    </button>

                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0a] text-white hover:bg-[#262626] rounded-xl transition-all text-sm mb-6 font-medium shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Chat
                    </button>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider pl-2">Recent History</h4>
                        <div className="space-y-1">
                            {history.map((h, i) => (
                                <div key={i} className="group relative">
                                    <button 
                                        onClick={() => loadConversation(h.conversation_id, h.service_id)}
                                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-2 pr-10 ${
                                            activeConversationId === h.conversation_id 
                                            ? 'bg-black/5 text-black font-semibold shadow-sm' 
                                            : 'text-gray-500 hover:text-black hover:bg-black/5'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeConversationId === h.conversation_id ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-700'}`}></div>
                                        <span className="truncate">{h.service_id} Session</span>
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteConversation(e, h.conversation_id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-500/10"
                                        title="Delete conversation"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-xs text-gray-600 pl-2">No history yet.</p>}
                        </div>
                    </div>
                    
                    {/* Bottom Links */}
                    <div className="mt-auto pt-4 border-t border-black/5 space-y-1">
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-black hover:bg-black/5 rounded-lg transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-transparent relative">
                
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-4 border-b border-black/5 bg-[#f5f5f0]/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:text-black">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        
                        <div className="relative">
                            <select 
                                value={activeService?.id || ''} 
                                onChange={(e) => setActiveService(services.find(s => s.id === e.target.value))}
                                className="appearance-none bg-white border border-black/10 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-black focus:outline-none focus:border-black/30 cursor-pointer shadow-sm"
                            >
                                {services.map(s => (
                                    <option key={s.id} value={s.id} className="bg-white">{s.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        {/* Session Timer Badge */}
                        {sessionStatus === 'active' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                <span>{sessionCountdown}</span>
                            </div>
                        )}
                        {sessionStatus === 'expired' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 cursor-pointer" onClick={() => setIsAuthModalOpen(true)}>
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                <span>Session expired</span>
                            </div>
                        )}
                        {sessionStatus === 'none' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 border border-black/10 text-xs font-medium text-gray-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                                <span>No session</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={handleShare} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-3xl mx-auto h-full flex flex-col">
                        
                        {messages.length === 0 ? (
                            <div className="flex flex-col justify-center h-full pt-12 md:pt-24 animate-fade-in">
                                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
                                    <span className="gradient-text">Hello, {user?.name.split(' ')[0]}</span><br/>
                                    <span className="text-black text-3xl md:text-4xl">How can I help you today?</span>
                                </h1>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {services.slice(0,4).map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => { setActiveService(s); setInput(`I want to use the ${s.name} service for...`); }}
                                            className="clean-card bg-white p-6 rounded-2xl text-left transition-all group hover:shadow-sm"
                                        >
                                            <h3 className="font-semibold text-black mb-2 group-hover:text-purple-600 transition-colors">{s.name}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 ${
                                            msg.role === 'user' 
                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' 
                                            : 'bg-white border border-black/10 text-black shadow-sm'
                                        }`}>
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                                                        <span className="text-xs font-semibold text-purple-700">{activeService?.name || 'AI Assistant'}</span>
                                                    </div>
                                                    <button onClick={() => handleCopy(msg.content)} className="p-1 hover:bg-black/5 rounded transition-colors text-gray-500 hover:text-black" title="Copy response">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gradient-to-t from-[#f5f5f0] via-[#f5f5f0]/90 to-transparent pt-10 border-t border-black/5">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Ask ${activeService?.name || 'AI'} something...`}
                                className="w-full bg-white border border-black/10 focus:border-purple-500/50 text-black rounded-2xl pl-5 pr-32 py-4 outline-none shadow-sm transition-all focus:shadow-purple-500/10"
                                disabled={chatLoading}
                            />
                            <div className="absolute right-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500 mr-2 hidden sm:inline">{activeService?.price_algo} ALGO/req</span>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || chatLoading}
                                    className="bg-[#0a0a0a] text-white hover:bg-[#262626] disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 p-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </div>
                        </form>
                        <p className="text-center text-xs text-gray-600 mt-3">
                            AI can make mistakes. Verify important information. Balances are stored on the Algorand TestNet.
                        </p>
                    </div>
                </div>

            </div>

            {/* Profile Modal */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="clean-card bg-white max-w-sm w-full p-6 rounded-2xl relative border border-black/10 shadow-2xl">
                        <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">✕</button>
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-3xl shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-4">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-black">{user?.name}</h2>
                            <p className="text-xs text-purple-600 font-mono mt-1">@{walletAddress.slice(0, 10)}...{walletAddress.slice(-4)}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 border border-black/5 p-3 rounded-xl">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Spent (30d)</p>
                                <p className="text-lg font-bold text-black">{stats?.spent_algo_30d.toFixed(2) || '0.00'} <span className="text-[10px] text-purple-600">ALGO</span></p>
                            </div>
                            <div className="bg-gray-50 border border-black/5 p-3 rounded-xl">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Avg/Session</p>
                                <p className="text-lg font-bold text-black">{stats?.avg_algo_per_session.toFixed(2) || '0.00'} <span className="text-[10px] text-purple-600">ALGO</span></p>
                            </div>
                            <div className="bg-gray-50 border border-black/5 p-3 rounded-xl col-span-2">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tokens Used (30d)</p>
                                <p className="text-lg font-bold text-black">{stats?.tokens_used_30d || '0'}</p>
                            </div>
                        </div>

                        <div className="space-y-3 bg-white p-4 rounded-xl border border-black/10">
                            <div>
                                <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Email Address</span>
                                <span className="text-sm text-black">{user?.email}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Date of Birth</span>
                                <span className="text-sm text-black">{user?.dob}</span>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={() => setIsProfileOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-black w-full py-2.5 rounded-xl text-sm font-medium transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="clean-card bg-white max-w-md w-full p-8 rounded-2xl relative border border-black/10 shadow-2xl text-center">
                        <button onClick={() => { setIsAuthModalOpen(false); setPendingPrompt(''); }} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">✕</button>
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 border border-purple-200">
                            <span className="text-2xl">{sessionStatus === 'expired' ? '⏳' : '⚡'}</span>
                        </div>

                        {sessionStatus === 'expired' ? (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">Session Expired</h2>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                    Your 24-hour session has expired. Sign once to renew.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleAuthorizeSession}
                                        disabled={isDepositing}
                                        className="w-full py-3 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg,#7c3aed,#6366f1)'}}
                                    >
                                        {isDepositing ? (
                                            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>Awaiting Signature...</>
                                        ) : (
                                            balance >= 0.5 ? 'Renew session (free)' : 'Deposit 5 ALGO and start session'
                                        )}
                                    </button>
                                    <button onClick={() => { setIsAuthModalOpen(false); setPendingPrompt(''); }} disabled={isDepositing} className="bg-gray-100 hover:bg-gray-200 text-black w-full py-3 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-black mb-2">Authorize AI Session</h2>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                    To start chatting, you need to authorize a session allowance of <strong className="text-black">5.0 ALGO</strong>.
                                    You will only be asked to sign via Pera Wallet <strong className="text-black">once</strong>.
                                    Future messages will be automatically deducted.
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleAuthorizeSession}
                                        disabled={isDepositing}
                                        className="w-full py-3 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{background:'linear-gradient(135deg,#7c3aed,#6366f1)'}}
                                    >
                                        {isDepositing ? (
                                            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>Awaiting Signature...</>
                                        ) : (
                                            'Sign with Pera Wallet'
                                        )}
                                    </button>
                                    <button onClick={() => { setIsAuthModalOpen(false); setPendingPrompt(''); }} disabled={isDepositing} className="bg-gray-100 hover:bg-gray-200 text-black w-full py-3 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="clean-card bg-white max-w-sm w-full p-8 rounded-3xl border border-black/10 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">Delete Conversation?</h3>
                        <p className="text-gray-600 text-sm mb-8">This action cannot be undone. All messages in this session will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-black font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors shadow-lg shadow-red-600/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-up transition-all ${
                    toast.type === 'error'
                    ? 'bg-red-50/90 border-red-500/30 text-red-600'
                    : 'bg-white/90 border-black/10 text-black'
                }`}>
                    <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
