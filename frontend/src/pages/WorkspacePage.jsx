import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiwa } from '../hooks/useSiwa';
import {
    depositWalletFunds,
    generateImage,
    getConversationHistory,
    getConversationMessages,
    getPaymentInfo,
    getServices,
    mintNFT,
    streamChat,
    transferNFT,
    getUserProfile,
    getUserAnalytics,
    deleteConversation,
} from '../api/client';

const ICONS = {
    llama3: '⚡',
    gpt4o_mini: '🚀',
    gemini_flash: '🎯',
    qwen25: '🧠',
};

// Provider badge colours for each service
const PROVIDER_BADGE = {
    llama3:       { label: 'Groq',       color: 'bg-pink-200' },
    gpt4o_mini:   { label: 'OpenAI',      color: 'bg-yellow-200' },
    gemini_flash: { label: 'Google',     color: 'bg-green-200' },
    qwen25:       { label: 'HuggingFace', color: 'bg-blue-100' },
};

const QUICK_PROMPTS = [
    'Explain the significance of the Turing Test.',
    'Write a Python script to scrape a website.',
    'Draft a professional email to a client.',
];

const ALGOD_API = 'https://testnet-api.algonode.cloud';

const formatMicroAlgo = (microAlgo) => (Number(microAlgo || 0) / 1_000_000).toFixed(3);

const WorkspacePage = () => {
    const navigate = useNavigate();
    const { signOut } = useSiwa();
    const wallet = sessionStorage.getItem('wallet_address');
    const messagesEndRef = useRef(null);
    const peraWalletRef = useRef(null);

    const [service, setService] = useState(null);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [totalTokens, setTotalTokens] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [history, setHistory] = useState([]);
    const [payingStatus, setPayingStatus] = useState('');
    const [sessionStatus, setSessionStatus] = useState('inactive'); // inactive, active, expired
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [, setTick] = useState(0); // Used to force re-render for countdown
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);

    const [isMinting, setIsMinting] = useState(false);
    const [mintedAssetId, setMintedAssetId] = useState(null);
    const [isOptingIn, setIsOptingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [allServices, setAllServices] = useState([]);



    useEffect(() => {
        if (!wallet) {
            navigate('/');
            return;
        }
        setServiceLoading(true);
        getServices()
            .then((services) => {
                setAllServices(services);
                if (services.length > 0) {
                    setService(services[0]); // Always start with the first service
                }
            })
            .catch((err) => {
                console.error('Failed to fetch services:', err);
                setService({
                    id: 'llama3',
                    name: 'Llama 3.3 (Groq)',
                    description: 'Lightning-fast general purpose reasoning model powered by Groq.',
                    price_algo: 0.1,
                    price_microalgo: 100000,
                    example_prompt: 'Explain the significance of the Turing Test.',
                });
            })
            .finally(() => setServiceLoading(false));
    }, [wallet, navigate]);

    const checkSessionStatus = useCallback(async () => {
        if (!wallet || !paymentInfo?.app_id) return;
        try {
            const algosdk = (await import('algosdk')).default;
            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const appId = parseInt(paymentInfo.app_id);
            try {
                const seBoxName = new Uint8Array([
                    ...new TextEncoder().encode('se_'),
                    ...algosdk.decodeAddress(wallet).publicKey,
                ]);
                const sbBoxName = new Uint8Array([
                    ...new TextEncoder().encode('sb_'),
                    ...algosdk.decodeAddress(wallet).publicKey,
                ]);

                const [seBox, sbBox] = await Promise.all([
                    client.getApplicationBoxByName(appId, seBoxName).do(),
                    client.getApplicationBoxByName(appId, sbBoxName).do()
                ]);

                const expiry = Number(algosdk.decodeUint64(seBox.value, 'safe'));
                const balance = Number(algosdk.decodeUint64(sbBox.value, 'safe'));
                const now = Math.floor(Date.now() / 1000);
                
                setSessionExpiry(expiry);
                // Require at least 5000 microAlgos to be considered 'active'
                if (expiry > now && balance > 5000) {
                    setSessionStatus('active');
                    return true;
                } else if (expiry <= now) {
                    setSessionStatus('expired');
                    return false;
                } else {
                    setSessionStatus('limit_exceeded');
                    return false;
                }
            } catch (e) {
                setSessionStatus('inactive');
                return false;
            }
        } catch (err) {
            console.error('Session check failed:', err);
        }
    }, [wallet, paymentInfo]);

    useEffect(() => {
        if (!service || !wallet) return;
        getPaymentInfo(service.id).then((info) => {
            setPaymentInfo(info);
        }).catch(() => {});
        getConversationHistory(wallet, null).then(setHistory).catch(() => {});
        getUserProfile(wallet).then(setUserProfile).catch(() => {});
        getUserAnalytics(wallet).then(setUserAnalytics).catch(() => {});
    }, [service, wallet]);

    useEffect(() => {
        if (paymentInfo) checkSessionStatus();
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [paymentInfo, checkSessionStatus]);

    const loadConversation = useCallback(
        async (convId) => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getConversationMessages(wallet, convId);
                setConversationId(convId);
                setMessages(data.messages || []);
                setTotalTokens(data.total_tokens || 0);
                setTotalCost(data.total_cost_usd || 0);
                setIsSidebarOpen(false);

                const u = new URL(window.location);
                u.searchParams.set('session', convId);
                window.history.pushState({}, '', u);

                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } catch (e) {
                setError(`Failed to load session: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        },
        [wallet]
    );

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const sessionParam = queryParams.get('session');
        if (sessionParam && sessionParam !== conversationId && !isLoading && wallet) {
            loadConversation(sessionParam);
        }
    }, [location.search, wallet, conversationId, isLoading, loadConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const usageRows = useMemo(() => {
        if (!history.length) {
            return [];
        }

        return history.slice(0, 5).map((item, index) => ({
            id: item.conversation_id || index,
            label: item.title || `${service?.name || 'AI'} session`,
            tokens: item.total_tokens || 0,
            cost: item.total_cost_usd || 0,
            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
            conversationId: item.conversation_id,
        }));
    }, [history, service]);

    const remainingTime = useMemo(() => {
        if (!sessionExpiry || sessionStatus !== 'active') return '';
        const now = Math.floor(Date.now() / 1000);
        const diff = sessionExpiry - now;
        if (diff <= 0) return 'Expiring...';
        const hours = Math.floor(diff / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m left`;
        return `${mins}m left`;
    }, [sessionExpiry, sessionStatus]);

    const handleStartSession = async () => {
        try {
            setIsStartingSession(true);
            setError(null);

            const { PeraWalletConnect } = await import('@perawallet/connect');
            const algosdk = (await import('algosdk')).default;

            if (!peraWalletRef.current) {
                peraWalletRef.current = new PeraWalletConnect({
                    shouldShowSignTxnToast: true,
                });
            }
            const pw = peraWalletRef.current;

            let accounts = [];
            try {
                accounts = await pw.reconnectSession();
            } catch (_) {}
            if (!accounts || !accounts.length) {
                accounts = await pw.connect();
            }
            if (accounts[0] !== wallet) throw new Error('Wallet mismatch. Please reconnect the correct wallet.');

            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await client.getTransactionParams().do();
            const appId = parseInt(paymentInfo.app_id);

            const sessionMethod = new algosdk.ABIMethod({
                name: 'start_session',
                args: [
                    { type: 'uint64', name: 'max_spend' },
                    { type: 'uint64', name: 'expiry_time' },
                ],
                returns: { type: 'bool' },
            });

            const expiryTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
            const depositAmount = 1000000; // 1 ALGO buffer for seamless prompting
            const maxSpend = (paymentInfo?.balance_microalgo || 0) + depositAmount; // Authorize entire balance

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({
                addr: wallet,
                sk: new Uint8Array(64),
            });

            const atc = new algosdk.AtomicTransactionComposer();

            // Add a 1 ALGO payment + deposit call to satisfy the MBR and fund the user's prompts
            // for the on-chain boxes. This is required by the Algorand network to store session data.
            const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: paymentInfo.contract_address,
                amount: depositAmount, // 1 ALGO
                suggestedParams: params,
            });

            const depositMethod = new algosdk.ABIMethod({
                name: 'deposit',
                args: [{ type: 'pay', name: 'payment' }],
                returns: { type: 'uint64' },
            });

            atc.addMethodCall({
                appID: appId,
                method: depositMethod,
                methodArgs: [{ txn: payTxn, signer: dummySigner }],
                sender: wallet,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [{ appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) }],
            });

            // Now start the session
            atc.addMethodCall({
                appID: appId,
                method: sessionMethod,
                methodArgs: [maxSpend, expiryTime],
                sender: wallet,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                ],
            });

            const group = atc.buildGroup().map(t => t.txn);
            const signed = await pw.signTransaction([
                group.map(txn => ({ txn, signers: [wallet] }))
            ]);
            
            setPayingStatus('Sending to Algorand...');
            const { txId } = await client.sendRawTransaction(signed).do();
            
            setPayingStatus('Confirming session on-chain...');
            await algosdk.waitForConfirmation(client, txId, 10);
            
            setPayingStatus('Syncing session state...');
            // Poll for box state updates for up to 5 seconds
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const active = await checkSessionStatus();
                if (active) break;
            }
            
            setIsSessionModalOpen(false);
            setPayingStatus('');
        } catch (e) {
            setError(`Session failed: ${e.message}`);
        } finally {
            setIsStartingSession(false);
        }
    };


    const handleOptIn = async (assetId) => {
        try {
            setIsOptingIn(true);
            setError(null);
            const { PeraWalletConnect } = await import('@perawallet/connect');
            const algosdk = (await import('algosdk')).default;

            const pw = new PeraWalletConnect();
            try {
                await pw.reconnectSession();
            } catch (_) {}

            const algodClient = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await algodClient.getTransactionParams().do();

            const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: wallet,
                amount: 0,
                assetIndex: parseInt(assetId),
                suggestedParams: params,
            });

            const signed = await pw.signTransaction([[{ txn, signers: [wallet] }]]);
            await algodClient.sendRawTransaction(signed).do();
            await algosdk.waitForConfirmation(algodClient, txn.txID().toString(), 4);

            return true;
        } catch (e) {
            setError(`Opt-in failed: ${e.message}`);
            return false;
        } finally {
            setIsOptingIn(false);
        }
    };

    const handleMintNFT = async (imageUrl, promptText) => {
        try {
            setIsMinting(true);
            setError(null);

            const result = await mintNFT(wallet, imageUrl, promptText);
            const assetId = result.asset_id;

            setPayingStatus(`NFT created! Asset ID: ${assetId}. Please opt in from your wallet to receive it.`);
            const optedIn = await handleOptIn(assetId);

            if (optedIn) {
                setPayingStatus(`Transferring Asset ${assetId} to your wallet...`);
                await transferNFT(wallet, assetId);

                setMintedAssetId(assetId);
                setPayingStatus('NFT successfully sent to your wallet! ✨');
                setTimeout(() => setPayingStatus(''), 5000);
            }
        } catch (e) {
            setError(`Minting failed: ${e.message}`);
        } finally {
            setIsMinting(false);
        }
    };

    const handleSendPrompt = async (e) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading || !service) return;

        const userPrompt = prompt.trim();
        setPrompt('');
        setError(null);
        setIsLoading(true);
        setPayingStatus(
            service.id === 'image_studio'
                ? `Generating image...`
                : `Running ${service?.name || 'AI'}...`
        );
        setMessages((prev) => [...prev, { role: 'user', content: userPrompt, tokens_used: 0, cost_usd: 0 }]);

        try {
            if (service.id === 'image_studio') {
                const result = await generateImage(wallet, userPrompt, conversationId);
                setConversationId(result.conversation_id);
                const updated = await getConversationMessages(wallet, result.conversation_id);
                setMessages(updated.messages || []);
            } else {
                const res = await streamChat(service.id, wallet, userPrompt, conversationId, null);
                
                // Add a placeholder message for the assistant
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: '', tokens_used: 0, cost_usd: 0 }
                ]);
                
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    const chunkStr = decoder.decode(value, { stream: true });
                    const lines = chunkStr.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            if (!dataStr) continue;
                            
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.error) {
                                    throw new Error(data.error);
                                }
                                if (data.chunk) {
                                    fullText += data.chunk;
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        newMsgs[newMsgs.length - 1].content = fullText;
                                        return newMsgs;
                                    });
                                }
                                if (data.done) {
                                    setConversationId(data.conversation_id);
                                    setMessages(data.messages || []);
                                    setTotalTokens(data.total_tokens_session || 0);
                                    setTotalCost(data.total_cost_session || 0);
                                }
                            } catch (e) {
                                // If we explicitly threw the error from the backend payload, re-throw it to catch block
                                if (dataStr.includes('"error"')) {
                                    throw new Error(JSON.parse(dataStr).error);
                                }
                            }
                        }
                    }
                }
            }

            getConversationHistory(wallet, null).then(setHistory).catch(() => {});
        } catch (err) {
            setError(err.message || 'Request failed');
            setMessages((prev) => prev.slice(0, -1));
            setPrompt(userPrompt);
        } finally {
            setIsLoading(false);
            setIsStartingSession(false);
            setPayingStatus('');
        }
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat history?')) return;
        try {
            await deleteConversation(id);
            if (conversationId === id) {
                setConversationId(null);
                setMessages([]);
            }
            // Refresh history and analytics
            getConversationHistory(wallet, null).then(setHistory).catch(() => {});
            getUserAnalytics(wallet).then(setUserAnalytics).catch(() => {});
        } catch (err) {
            setError('Failed to delete chat: ' + err.message);
        }
    };

    const Sidebar = ({ isMobile = false }) => (
        <div className="flex min-h-full flex-col bg-white text-[#111]">
            <div className="flex items-start justify-between gap-3">
                <button 
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex flex-1 items-center gap-3 rounded-xl border-2 border-[#111] bg-yellow-200 p-2 shadow-[3px_3px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none text-left min-w-0"
                >
                    <div className="h-10 w-10 shrink-0 rounded-full border-2 border-[#111] bg-pink-200 flex items-center justify-center font-black text-lg">
                        {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Workspace</p>
                        <p className="truncate text-sm font-black">{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : 'User'}</p>
                    </div>
                </button>
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-xl border-2 border-[#111] bg-pink-200 px-3 py-1 text-sm font-black shadow-[3px_3px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        aria-label="Close workspace menu"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="mt-5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <p className="font-black text-xs uppercase tracking-widest opacity-60">History</p>
                        <span className="rounded-full bg-[#111] px-2 py-1 text-[10px] font-black text-white">{usageRows.length}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setMessages([]);
                            setConversationId(null);
                            navigate('/dashboard');
                            if (isMobile) setIsSidebarOpen(false);
                        }}
                        className="flex items-center gap-1 rounded-lg border-2 border-[#111] bg-cyan-300 px-2.5 py-1 text-[10px] font-black shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        title="Start a new chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        NEW
                    </button>
                </div>
                <div className="mt-2 space-y-2 flex-1 overflow-y-auto pr-1">
                    {usageRows.map((row) => (
                        <div key={row.id} className="relative group flex items-stretch">
                            <button
                                type="button"
                                onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                className={`w-full rounded-xl border-2 border-[#111] p-2 text-left text-sm shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-1 md:border-4 ${
                                    row.conversationId === conversationId ? 'bg-green-200' : 'bg-white'
                                }`}
                            >
                                <span className="block truncate pr-8 font-black">{row.label}</span>
                                <span className="mt-1 flex items-center justify-between gap-2 text-[11px] font-bold opacity-60">
                                    <span>{row.tokens} tokens</span>
                                    <span>${Number(row.cost).toFixed(4)}</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(e, row.conversationId)}
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white hover:bg-red-500 hover:text-white transition-all rounded-lg border-2 border-[#111] shadow-[2px_2px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center"
                                title="Delete Chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t-2 md:border-t-4 border-[#111]">
                    <button
                        type="button"
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className="w-full rounded-xl border-2 border-[#111] bg-pink-200 p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none md:border-4 flex items-center justify-center gap-2"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        </div>
    );

    const MessageBubble = ({ msg, index }) => {
        const isUser = msg.role === 'user';
        const isImage = typeof msg.content === 'string' && msg.content.startsWith('[IMAGE]');
        const imageUrl = isImage ? msg.content.replace('[IMAGE]', '') : '';

        return (
            <div className={`flex animate-fadeUp ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[92%] rounded-xl border-2 border-[#111] p-3 text-sm shadow-[4px_4px_0px_#111] transition-all md:max-w-[70%] md:border-4 md:text-base ${
                        isUser ? 'bg-yellow-200' : 'bg-white'
                    }`}
                    style={{ animationDelay: `${index * 35}ms` }}
                >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border-2 border-[#111] bg-[#111] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                            {isUser ? 'You' : (PROVIDER_BADGE[service?.id]?.label || service?.name || 'AI')}
                        </span>
                        {msg.tokens_used > 0 && !isImage && (
                            <span className="text-[11px] font-black opacity-60">
                                {msg.tokens_used} tokens · ${msg.cost_usd ? msg.cost_usd.toFixed(6) : '0.000000'}
                            </span>
                        )}
                    </div>

                    {isImage ? (
                        <div className="space-y-4">
                            <img
                                src={imageUrl}
                                alt="Generated AI artwork"
                                className="w-full rounded-xl border-2 border-[#111] object-cover md:border-4"
                            />
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl border-2 border-[#111] bg-green-200 px-4 py-2 text-sm font-black shadow-[4px_4px_0px_#111] md:border-4"
                                >
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleMintNFT(imageUrl, messages[index - 1]?.content || 'AI image')}
                                    disabled={isMinting || isOptingIn}
                                    className="rounded-xl border-2 border-[#111] bg-pink-200 px-4 py-2 text-sm font-black shadow-[4px_4px_0px_#111] disabled:opacity-50 md:border-4"
                                >
                                    {isMinting || isOptingIn ? 'Minting...' : 'Mint as NFT'}
                                </button>
                            </div>
                            {mintedAssetId && (
                                <p className="rounded-xl border-2 border-[#111] bg-yellow-200 px-3 py-2 text-xs font-black">
                                    Minted on Algorand Testnet: #{mintedAssetId}
                                </p>
                            )}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans">
                            {msg.content}
                        </pre>
                    )}
                </div>
            </div>
        );
    };

    if (serviceLoading || !service) {
        return (
            <div className="min-h-screen bg-[#fff7df] pt-24 text-neo-ink">
                <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
                    <div className="neo-card bg-white p-8 text-center">
                        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-neo-ink border-t-neo-blue" />
                        <p className="text-lg font-black">Loading workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] overflow-hidden bg-[#fff7df] font-sans text-[#111]">
            {isSessionModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#fff7df]/80 backdrop-blur-sm" onClick={() => !isStartingSession && setIsSessionModalOpen(false)} />
                    <div className="animate-fadeUp relative w-full max-w-sm rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                        {sessionStatus === 'active' ? (
                            <>
                                <h2 className="text-xl font-black mb-2">🛑 End Smart Session?</h2>
                                <p className="text-sm font-bold opacity-70 mb-6">
                                    Your session is currently active. Ending it will clear your session locally so you can easily start a new one.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-white py-2.5 text-sm font-black shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSessionStatus('inactive');
                                            setSessionExpiry(null);
                                            setIsSessionModalOpen(false);
                                        }}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-pink-200 py-2.5 text-sm font-black shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none"
                                    >
                                        End Session
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black mb-2">🚀 Start Smart Session?</h2>
                                <p className="text-sm font-bold opacity-70 mb-6">
                                    Approving a session allows us to process micro-payments automatically for 24 hours. No manual approval for every message!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-white py-2.5 text-sm font-black shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none"
                                    >
                                        Not Now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-neo-blue py-2.5 text-sm font-black text-white shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none disabled:opacity-50"
                                    >
                                        {isStartingSession ? 'Waiting...' : 'Approve'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default bg-[#fff7df]/80 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                        aria-label="Close profile modal overlay"
                    />
                    <div className="animate-fadeUp relative w-full max-w-md rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="h-16 w-16 shrink-0 rounded-full border-4 border-[#111] bg-pink-200 flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_#111]">
                                {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 className="text-xl font-black">{userProfile?.name || 'Anonymous User'}</h2>
                                <p className="text-sm font-bold opacity-60">{userProfile?.email || 'user@example.com'}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="rounded-xl border-2 border-[#111] bg-yellow-200 p-4 shadow-[4px_4px_0px_#111]">
                                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.15em] opacity-60">Tokens Used</h3>
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold opacity-60">Last 30 Days</p>
                                        <p className="text-lg font-black">{(userAnalytics?.tokens_used_30d || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold opacity-60">Total Sessions</p>
                                        <p className="text-lg font-black">{userAnalytics?.total_sessions || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border-2 border-[#111] bg-green-200 p-4 shadow-[4px_4px_0px_#111]">
                                <h3 className="mb-2 text-xs font-black uppercase tracking-[0.15em] opacity-60">Algos Spent</h3>
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold opacity-60">Last 30 Days</p>
                                        <p className="text-lg font-black">{(userAnalytics?.spent_algo_30d || 0).toFixed(2)} ALGO</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold opacity-60">Avg / Session</p>
                                        <p className="text-lg font-black">{(userAnalytics?.avg_algo_per_session || 0).toFixed(2)} ALGO</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsProfileModalOpen(false)}
                            className="mt-6 w-full rounded-xl border-2 border-[#111] bg-white p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close workspace menu overlay"
                    />
                    <aside className="animate-slideIn relative w-[270px] overflow-y-auto border-r-2 border-[#111] bg-white p-3">
                        <Sidebar isMobile />
                    </aside>
                </div>
            )}

            <div className="grid h-full grid-cols-1 md:grid-cols-[260px_1fr]">
                <aside className="hidden overflow-y-auto border-r-4 border-[#111] bg-white p-4 md:block">
                    <Sidebar />
                </aside>

                <main className="flex h-[100dvh] flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b-4 border-[#111] bg-white p-3 font-black">
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm md:text-base">
                                <span className="text-base">{ICONS[service?.id] || '✨'}</span>
                                <span className="truncate font-black">{service?.name || 'Workspace'}</span>
                                {service && PROVIDER_BADGE[service.id] && (
                                    <span className={`hidden shrink-0 rounded-full border border-[#111] px-2 py-0.5 text-[9px] font-black md:inline ${PROVIDER_BADGE[service.id].color}`}>
                                        {PROVIDER_BADGE[service.id].label}
                                    </span>
                                )}
                                <span className="hidden opacity-30 md:inline">•</span>
                                
                                <div 
                                    onClick={() => setIsSessionModalOpen(true)}
                                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-[#111] px-2 py-1 text-[10px] shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none md:text-xs ${
                                        sessionStatus === 'active' ? 'bg-green-200' : (sessionStatus === 'expired' || sessionStatus === 'limit_exceeded') ? 'bg-pink-200' : 'bg-yellow-200'
                                    }`}
                                >
                                    <span className="hidden md:inline">Smart Session:</span>
                                    <span className="font-black">
                                        {sessionStatus === 'active' 
                                            ? `Approved (${remainingTime})` 
                                            : sessionStatus === 'expired' 
                                            ? 'Expired' 
                                            : sessionStatus === 'limit_exceeded'
                                            ? 'Limit Reached'
                                            : 'Start Session'
                                        }
                                    </span>
                                </div>
                            </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="relative rounded-xl border-2 border-[#111] bg-green-200 px-3 py-1.5 text-[10px] font-black shadow-[3px_3px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none md:hidden"
                            >
                                Menu
                            </button>
                        </div>
                    </div>

                    {(payingStatus || error) && (
                        <div
                            className={`mx-2 mt-2 shrink-0 rounded-xl border-2 border-[#111] p-3 text-sm font-black shadow-[4px_4px_0px_#111] md:mx-4 md:border-4 ${
                                error ? 'bg-pink-200' : 'bg-yellow-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{error ? '🚫' : '⏳'}</span>
                                <span className="flex-1">{error || payingStatus}</span>
                                {error && (
                                    <button 
                                        type="button" 
                                        onClick={() => setError(null)} 
                                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#111] bg-white hover:bg-[#111] hover:text-white transition-colors font-black" 
                                        aria-label="Dismiss error"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto p-2 pb-4 md:p-4">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col min-h-full items-center justify-center py-6 max-w-4xl mx-auto w-full px-4">
                                <div className="text-center mb-6 animate-fadeUp">
                                    <h2 className="text-2xl font-black text-neo-blue mb-1 md:text-3xl">
                                        Hello, {userProfile?.name?.split(' ')[0] || 'User'}
                                    </h2>
                                    <h3 className="text-lg font-black md:text-2xl opacity-80">How can I help you today?</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-fadeUp delay-100">
                                    {allServices.filter(s => ['llama3', 'gpt4o_mini', 'gemini_flash', 'qwen25'].includes(s?.id)).map((s) => {
                                        const badge = PROVIDER_BADGE[s.id];
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                    setService(s);
                                                    setMessages([]);
                                                    setConversationId(null);
                                                }}
                                                className={`rounded-xl border-2 border-[#111] p-4 text-left shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1 active:shadow-none md:border-4 ${
                                                    s.id === service?.id ? 'bg-yellow-100' : 'bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#111] bg-yellow-200 text-base font-black md:border-[3px] shadow-[2px_2px_0px_#111]">
                                                            {ICONS[s.id] || '✨'}
                                                        </div>
                                                        <span className="font-black text-base">{s.name}</span>
                                                    </div>
                                                    {badge && (
                                                        <span className={`shrink-0 rounded-full border border-[#111] px-2 py-0.5 text-[9px] font-black ${badge.color}`}>
                                                            {badge.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold opacity-70 leading-snug line-clamp-2">
                                                    {s.example_prompt || s.description || 'Click to start.'}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fadeUp delay-200">
                                    {QUICK_PROMPTS.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setPrompt(item)}
                                            className="rounded-xl border-2 border-[#111] bg-white px-3 py-1.5 text-[10px] font-black shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-none md:border-[3px]"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <MessageBubble key={`${msg.role}-${index}-${msg.content?.slice?.(0, 12) || index}`} msg={msg} index={index} />
                        ))}

                        {isLoading && (
                            <div className="w-fit animate-pulse rounded-xl border-2 border-[#111] bg-white p-3 text-sm font-black shadow-[4px_4px_0px_#111] md:border-4">
                                {payingStatus || 'Thinking...'}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="sticky bottom-0 shrink-0 bg-[#fff7df] p-2">
                        <form onSubmit={handleSendPrompt} className="flex items-center gap-2 rounded-xl border-2 border-[#111] bg-white p-2 md:border-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={sessionStatus !== 'active' ? 'Start a session to continue...' : (messages.length === 0 ? 'Type prompt...' : 'Type a follow-up...')}
                                className="h-11 min-w-0 flex-1 resize-none rounded-lg border-2 border-[#111] bg-white px-3 py-2 text-sm outline-none md:h-12 md:border-4 md:text-base"
                                disabled={isLoading || sessionStatus !== 'active'}
                                maxLength={2000}
                            />
                            
                            <div className="flex items-center gap-2">
                                <select
                                    value={service?.id || ''}
                                    onChange={(e) => {
                                        const selected = allServices.find(s => s.id === e.target.value);
                                        if (selected) {
                                            setService(selected);
                                            // Allow changing models within the same chat without clearing messages
                                        }
                                    }}
                                    className="hidden h-11 cursor-pointer appearance-none rounded-lg border-2 border-[#111] bg-yellow-200 px-3 pr-8 text-xs font-black shadow-[3px_3px_0px_#111] outline-none transition-all focus:border-[#111] md:block md:h-12 md:border-4 md:px-4 md:pr-10 md:text-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat"
                                    disabled={isLoading}
                                >
                                    {allServices.filter(s => ['llama3', 'gpt4o_mini', 'gemini_flash', 'qwen25'].includes(s?.id)).map((s) => {
                                        const badge = PROVIDER_BADGE[s.id];
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {ICONS[s.id] || '✨'} {s.name}{badge ? ` · ${badge.label}` : ''} — {s.price_algo > 0 ? `${s.price_algo} ALGO` : 'Token-Based'}
                                            </option>
                                        );
                                    })}
                                </select>

                                <button
                                    type="submit"
                                    disabled={isLoading || !prompt.trim() || sessionStatus !== 'active'}
                                    className="h-11 whitespace-nowrap rounded-lg border-2 border-[#111] bg-green-200 px-4 text-sm font-black shadow-[3px_3px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:border-4 md:px-5 md:text-base"
                                >
                                    {isLoading ? 'Wait...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>

            <SidebarStyles />
        </div>
    );
};

function SidebarStyles() {
    return (
        <style>{`
            .animate-fadeUp {
                animation: fadeUp 0.25s ease-out;
            }

            @keyframes fadeUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .animate-slideIn {
                animation: slideIn 0.2s ease-out;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(-100%);
                }

                to {
                    transform: translateX(0);
                }
            }
        `}</style>
    );
}

export default WorkspacePage;
