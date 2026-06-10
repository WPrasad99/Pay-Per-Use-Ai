import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // Refresh V3
import { useNavigate, useParams } from 'react-router-dom';
import { useSiwa } from '../hooks/useSiwa';
import { peraWallet } from '../config/peraWallet';
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
    getCreatorProfile,
    getCreatorAgents,
    getAgentDetails,
    chatWithAgent,
    saveCreatorApiKey,
    getApiKeyStatus,
    createCreatorProfile,
} from '../api/client';

const MODEL_ICONS = {
    // OpenAI GPT-4o — official logo path
    gpt4o_mini: (
        <svg viewBox="0 0 41 41" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none">
            <rect width="41" height="41" rx="8" fill="#000"/>
            <path d="M36.48 17.29a10.16 10.16 0 00-.87-8.35 10.28 10.28 0 00-11.07-4.93A10.17 10.17 0 0016.84 1a10.29 10.29 0 00-9.81 7.13 10.17 10.17 0 00-6.8 4.93 10.28 10.28 0 001.27 12.05 10.16 10.16 0 00.87 8.35 10.28 10.28 0 0011.07 4.93A10.17 10.17 0 0021.16 40a10.3 10.3 0 009.82-7.14 10.17 10.17 0 006.79-4.93 10.28 10.28 0 00-1.29-12.05zM21.17 37.5a7.64 7.64 0 01-4.9-1.77l.24-.14 8.13-4.69a1.35 1.35 0 00.68-1.18v-11.46l3.44 1.98a.12.12 0 01.07.1v9.48a7.67 7.67 0 01-7.66 7.68zm-16.47-7.04a7.64 7.64 0 01-.92-5.15l.25.15 8.12 4.69a1.35 1.35 0 001.35 0l9.91-5.72v3.96a.12.12 0 01-.05.11l-8.22 4.74a7.68 7.68 0 01-10.44-2.78zm-2.14-17.82a7.63 7.63 0 014-3.37v9.62a1.35 1.35 0 00.68 1.18l9.9 5.71-3.43 1.98a.13.13 0 01-.12.01L5.1 23.1a7.68 7.68 0 01-.54-10.46zm28.2 6.59l-9.91-5.72 3.43-1.98a.12.12 0 01.12-.01l8.59 4.96a7.67 7.67 0 01-1.19 13.84v-9.62a1.34 1.34 0 00-.44-1.47v-.01zm3.42-5.18l-.25-.15-8.12-4.68a1.35 1.35 0 00-1.36 0l-9.91 5.72V11.08a.13.13 0 01.05-.11l8.22-4.74a7.67 7.67 0 0111.37 7.92zm-21.47 7.07l-3.44-1.98a.12.12 0 01-.07-.1V10.56a7.67 7.67 0 0112.57-5.9l-.24.14-8.13 4.69a1.34 1.34 0 00-.68 1.18l-.01 11.45zm1.87-4.04l4.41-2.55 4.42 2.55v5.08l-4.41 2.55-4.42-2.55V17.08z" fill="#fff"/>
        </svg>
    ),
    // Google Gemini — official star/sparkle logo
    gemini_flash: (
        <svg viewBox="0 0 41 41" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="41" height="41" rx="8" fill="#1a73e8"/>
            <path d="M20.5 6c0 0 0 0 0 0C20.5 14.5 26.5 20 35 20c0 0 0 0 0 0C26.5 20 20.5 25.5 20.5 35c0 0 0 0 0 0C20.5 25.5 14.5 20 6 20c0 0 0 0 0 0C14.5 20 20.5 14.5 20.5 6z" fill="white"/>
        </svg>
    ),
    // Meta Llama — stylized M on dark background
    llama3: (
        <svg viewBox="0 0 41 41" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="41" height="41" rx="8" fill="#0064E0"/>
            <path d="M20.5 9C14.15 9 9 14.15 9 20.5S14.15 32 20.5 32 32 26.85 32 20.5 26.85 9 20.5 9zm-5.2 17v-11l5.2 4 5.2-4v11l-5.2-3.5-5.2 3.5z" fill="white"/>
        </svg>
    ),
    // Qwen — Alibaba Cloud purple
    qwen25: (
        <svg viewBox="0 0 41 41" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="41" height="41" rx="8" fill="#612EF0"/>
            <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">Q</text>
        </svg>
    ),
};

const MODEL_LABELS = {
    llama3: 'Llama 3',
    gpt4o_mini: 'GPT-4o',
    gemini_flash: 'Gemini',
    qwen25: 'Qwen 2.5',
};

// Provider badge colours for each service
const PROVIDER_BADGE = {
    llama3:       { label: 'Groq',        color: 'bg-pink-200' },
    gpt4o_mini:   { label: 'OpenAI',      color: 'bg-yellow-200' },
    gemini_flash: { label: 'Google',      color: 'bg-green-200' },
    qwen25:       { label: 'HuggingFace', color: 'bg-blue-100' },
};



const CATEGORY_EMOJIS = {
    coding: '💻', business: '📊', marketing: '📣', legal: '⚖️',
    education: '📚', productivity: '⚡', content_creation: '✍️',
    data_analysis: '📈', creative: '🎨', general: '🌐',
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
    const { serviceId } = useParams();
    const { signOut } = useSiwa();
    const wallet = sessionStorage.getItem('wallet_address');
    const messagesEndRef = useRef(null);
    const peraWalletRef = useRef(null);
    const isStartingSessionRef = useRef(false);
    const isEndingSessionRef = useRef(false);

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
    const [sessionBalance, setSessionBalance] = useState(0);
    const [, setTick] = useState(0); // Used to force re-render for countdown
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);

    const [isMinting, setIsMinting] = useState(false);
    const [mintedAssetId, setMintedAssetId] = useState(null);
    const [isOptingIn, setIsOptingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [keyProvider, setKeyProvider] = useState('gemini');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [keyStatusList, setKeyStatusList] = useState([]);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [keySuccessMessage, setKeySuccessMessage] = useState('');
    const [keyErrorMessage, setKeyErrorMessage] = useState('');

    const fetchKeyStatus = async () => {
        try {
            const status = await getApiKeyStatus(wallet);
            setKeyStatusList(status.keys || []);
        } catch (e) {
            console.error('Failed to load API key status:', e);
        }
    };

    useEffect(() => {
        if (isApiKeyModalOpen && wallet) {
            fetchKeyStatus();
        }
    }, [isApiKeyModalOpen, wallet]);

    const handleSaveWorkspaceKey = async () => {
        if (!apiKeyInput.trim()) return;
        // Always save to the agent's actual provider
        const agentProvider = service?.provider || 'gemini';
        setIsSavingKey(true);
        setKeySuccessMessage('');
        setKeyErrorMessage('');
        try {
            try {
                await getCreatorProfile(wallet);
            } catch (pErr) {
                await createCreatorProfile(wallet, 'Creator', 'AI Agent Creator');
            }

            await saveCreatorApiKey(wallet, agentProvider, apiKeyInput.trim());
            setApiKeyInput('');
            await fetchKeyStatus();
            const providerLabel = agentProvider.charAt(0).toUpperCase() + agentProvider.slice(1);
            setKeySuccessMessage(`${providerLabel} API key updated! Your agent will now use the new key.`);
            // Also clear any existing error in chat since key was fixed
            setError(null);
            setTimeout(() => {
                setKeySuccessMessage('');
                setIsApiKeyModalOpen(false);
            }, 2500);
        } catch (e) {
            setKeyErrorMessage(e.message || 'Failed to save key. Please try again.');
        } finally {
            setIsSavingKey(false);
        }
    };

    const [userProfile, setUserProfile] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [allServices, setAllServices] = useState([]);
    const [isCreator, setIsCreator] = useState(false);



    useEffect(() => {
        if (!wallet) {
            navigate('/');
            return;
        }

        // Reset chat states to open in a fresh new chat when entering a model/agent directly!
        const queryParams = new URLSearchParams(window.location.search);
        const sessionParam = queryParams.get('session');
        if (!sessionParam) {
            setConversationId(null);
            setMessages([]);
        }

        setServiceLoading(true);
        if (serviceId && serviceId.startsWith('agent_')) {
            getAgentDetails(serviceId)
                .then((agent) => {
                    const mapped = {
                        id: agent.agent_id,
                        name: agent.name,
                        description: agent.description,
                        category: agent.category,
                        provider: agent.provider,
                        model: agent.model,
                        price_algo: agent.pricing_model === 'per_request' ? agent.price_per_request_microalgo / 1_000_000 : 0.001,
                        price_microalgo: agent.pricing_model === 'per_request' ? agent.price_per_request_microalgo : 1000,
                        example_prompt: 'Hello! What can you do?',
                        is_community: true,
                        pricing_model: agent.pricing_model,
                        price_input_microalgo: agent.price_input_microalgo,
                        price_output_microalgo: agent.price_output_microalgo,
                        creator_wallet: agent.creator_wallet,
                        creator_name: agent.creator_name,
                    };
                    setService(mapped);
                    getServices().then(setAllServices).catch(() => {});
                })
                .catch((err) => {
                    console.error('Failed to load agent details:', err);
                    setError('AI Agent not found or inactive');
                })
                .finally(() => setServiceLoading(false));
        } else {
            getServices()
                .then((services) => {
                    setAllServices(services);
                    if (services.length > 0) {
                        const matchedService = serviceId ? services.find(s => s.id === serviceId) : null;
                        setService(matchedService || services[0]);
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
        }
    }, [wallet, navigate, serviceId]);

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
                setSessionBalance(balance);
                
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
                console.error('Inner session check failed (expected if inactive):', e);
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
        // Check if user has agents
        getCreatorAgents(wallet).then(res => {
            setIsCreator((res.agents || []).length > 0);
        }).catch(() => setIsCreator(false));
    }, [service, wallet]);

    useEffect(() => {
        if (!paymentInfo) return;
        checkSessionStatus();
        const interval = setInterval(() => {
            checkSessionStatus();
        }, 15000); // Check on-chain status every 15 seconds
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

        return history.map((item, index) => {
            let labelText = item.title || '';
            if (labelText.length > 25) {
                labelText = labelText.slice(0, 23) + '...';
            }
            if (!labelText) {
                labelText = item.service_name || `${service?.name || 'AI'} Session`;
            }

            return {
                id: item.conversation_id || index,
                label: labelText,
                tokens: item.total_tokens || 0,
                cost: item.total_cost_usd || 0,
                date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
                conversationId: item.conversation_id,
                serviceId: item.service_id,
            };
        });
    }, [history, service]);

    const marketplaceRows = useMemo(() => {
        return usageRows.filter(row => row.serviceId && row.serviceId.startsWith('agent_'));
    }, [usageRows]);

    const generalRows = useMemo(() => {
        return usageRows.filter(row => !row.serviceId || !row.serviceId.startsWith('agent_'));
    }, [usageRows]);

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

    // Helper to convert raw blockchain/wallet errors into user-friendly messages
    const friendlyError = (e) => {
        let msg = '';
        if (typeof e === 'string') msg = e.toLowerCase();
        else if (e?.message) msg = e.message.toLowerCase();
        else {
            try { msg = JSON.stringify(e).toLowerCase(); } catch (_) { msg = 'unknown error'; }
        }
        
        if (msg.includes('cancel') || msg.includes('rejected') || msg.includes('declined'))
            return 'Transaction cancelled. You can try again anytime.';
        if (msg.includes('wallet mismatch'))
            return 'Wrong wallet connected. Please reconnect the correct one.';
        if (msg.includes('insufficient') || msg.includes('below min'))
            return 'Not enough ALGO. Please top up your wallet and try again.';
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout'))
            return 'Network error. Please check your connection and try again.';
        if (msg.includes('logic eval') || msg.includes('opcode'))
            return 'Smart contract rejected the transaction. Session may already be active or funds already withdrawn.';
        return 'Something went wrong. Please try again.';
    };

    const handleStartSession = async () => {
        if (isStartingSessionRef.current) return;
        isStartingSessionRef.current = true;
        try {
            setIsStartingSession(true);
            setError(null);

            const algosdk = (await import('algosdk')).default;
            const pw = peraWallet;

            let accounts = [];
            try { accounts = await pw.reconnectSession(); } catch (_) {}
            if (!accounts || !accounts.length) accounts = await pw.connect();
            if (accounts[0] !== wallet) throw new Error('Wallet mismatch');

            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await client.getTransactionParams().do();
            const appId = parseInt(paymentInfo.app_id);

            const sessionMethod = new algosdk.ABIMethod({
                name: 'start_session',
                args: [{ type: 'uint64', name: 'max_spend' }, { type: 'uint64', name: 'expiry_time' }],
                returns: { type: 'bool' },
            });
            const depositMethod = new algosdk.ABIMethod({
                name: 'deposit',
                args: [{ type: 'pay', name: 'payment' }],
                returns: { type: 'uint64' },
            });

            const expiryTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
            const depositAmount = 1000000;
            const maxSpend = (paymentInfo?.balance_microalgo || 0) + depositAmount;
            const dummySigner = algosdk.makeBasicAccountTransactionSigner({ addr: wallet, sk: new Uint8Array(64) });
            const atc = new algosdk.AtomicTransactionComposer();

            const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: paymentInfo.contract_address,
                amount: depositAmount,
                suggestedParams: params,
            });

            atc.addMethodCall({
                appID: appId, method: depositMethod,
                methodArgs: [{ txn: payTxn, signer: dummySigner }],
                sender: wallet, suggestedParams: params, signer: dummySigner,
                boxes: [{ appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) }],
            });
            atc.addMethodCall({
                appID: appId, method: sessionMethod,
                methodArgs: [maxSpend, expiryTime],
                sender: wallet, suggestedParams: params, signer: dummySigner,
                boxes: [
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                ],
            });

            const group = atc.buildGroup().map(t => t.txn);
            let signed;
            try {
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Initial session sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            }

            setPayingStatus('Sending to Algorand...');
            const { txId } = await client.sendRawTransaction(signed).do();

            setPayingStatus('Confirming on-chain...');
            await algosdk.waitForConfirmation(client, txId, 10);

            // Set active states immediately so the UI updates instantly
            setSessionStatus('active');
            setSessionBalance(maxSpend);
            setSessionExpiry(expiryTime);
            setPayingStatus('Session active! ✅');

            setTimeout(() => {
                setPayingStatus('');
                setIsSessionModalOpen(false);
            }, 1500);

            // Sync with blockchain after 3 seconds once the block is fully committed and indexers catch up
            setTimeout(() => {
                checkSessionStatus().catch(() => {});
            }, 3000);

        } catch (e) {
            console.error('Session start failed:', e);
            
            // Failsafe: even if Pera throws an error after user allows request,
            // let's do a quick check if the session actually went active.
            try {
                const isActive = await checkSessionStatus();
                if (isActive) {
                    setIsSessionModalOpen(false);
                    setPayingStatus('');
                    setError(null);
                    return;
                }
            } catch (innerErr) {}

            let msg = '';
            if (typeof e === 'string') msg = e.toLowerCase();
            else if (e?.message) msg = e.message.toLowerCase();
            else {
                try { msg = JSON.stringify(e).toLowerCase(); } catch (_) { msg = ''; }
            }

            if (msg.includes('timeout') || msg.includes('confirmation took too long')) {
                setSessionStatus('active');
                setSessionBalance(maxSpend);
                setSessionExpiry(expiryTime);
                setIsSessionModalOpen(false);
                setPayingStatus('');
            } else {
                setError(friendlyError(e));
                setPayingStatus('');
            }
        } finally {
            setIsStartingSession(false);
            isStartingSessionRef.current = false;
        }
    };

    const handleEndSessionAndWithdraw = async () => {
        if (isEndingSessionRef.current) return;
        isEndingSessionRef.current = true;
        try {
            setIsStartingSession(true);
            setError(null);
            const algosdk = (await import('algosdk')).default;
            const pw = peraWallet;
            let accounts = [];
            try { accounts = await pw.reconnectSession(); } catch (_) {}
            if (!accounts.length) accounts = await pw.connect();

            const client = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await client.getTransactionParams().do();
            const appId = parseInt(paymentInfo.app_id);

            const method = new algosdk.ABIMethod({
                name: 'end_session_and_withdraw',
                args: [], returns: { type: 'uint64' },
            });

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({ addr: wallet, sk: new Uint8Array(64) });
            const atc = new algosdk.AtomicTransactionComposer();
            const doubleFeeParams = { ...params, fee: 2000, flatFee: true };

            atc.addMethodCall({
                appID: appId, method, methodArgs: [],
                sender: wallet, suggestedParams: doubleFeeParams, signer: dummySigner,
                accounts: [wallet],
                boxes: [
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('b_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('sb_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                    { appIndex: appId, name: new Uint8Array([...new TextEncoder().encode('se_'), ...algosdk.decodeAddress(wallet).publicKey]) },
                ],
            });

            const group = atc.buildGroup().map(t => t.txn);
            let signed;
            try {
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Initial refund sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            }

            setPayingStatus('Processing refund...');
            const { txId } = await client.sendRawTransaction(signed).do();

            // Set states immediately & close modal so user feedback is instant
            setSessionStatus('inactive');
            setSessionBalance(0);
            setIsSessionModalOpen(false);
            setPayingStatus('Refund successful! Session ended. 💸');
            
            setTimeout(() => {
                setPayingStatus('');
            }, 2500);

            // Wait for confirmation & sync in the background
            (async () => {
                try {
                    await algosdk.waitForConfirmation(client, txId, 6);
                } catch (confErr) {
                    console.warn('Background refund confirmation check warning:', confErr);
                }
                checkSessionStatus().catch(() => {});
            })();

        } catch (e) {
            console.error('Refund failed:', e);
            // If the transaction actually succeeded but confirmation timed out, don't show error
            if (e.message?.includes('timeout') || e.message?.includes('Confirmation took too long')) {
                setSessionStatus('inactive');
                setSessionBalance(0);
                setIsSessionModalOpen(false);
                setPayingStatus('');
            } else {
                setError(friendlyError(e));
                setPayingStatus('');
            }
        } finally {
            setIsStartingSession(false);
            isEndingSessionRef.current = false;
        }
    };


    const handleOptIn = async (assetId) => {
        try {
            setIsOptingIn(true);
            setError(null);
            const algosdk = (await import('algosdk')).default;

            const pw = peraWallet;
            let accounts = [];
            try {
                accounts = await pw.reconnectSession();
            } catch (_) {}
            if (!accounts || !accounts.length) accounts = await pw.connect();

            const algodClient = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await algodClient.getTransactionParams().do();

            const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: wallet,
                amount: 0,
                assetIndex: parseInt(assetId),
                suggestedParams: params,
            });

            let signed;
            try {
                signed = await pw.signTransaction([[{ txn, signers: [wallet] }]]);
            } catch (signErr) {
                console.warn('Initial opt-in sign failed, trying refresh:', signErr);
                await pw.disconnect().catch(() => {});
                const freshAccounts = await pw.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await pw.signTransaction([[{ txn, signers: [wallet] }]]);
            }
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
        // Snapshot the model/service name at the exact moment the user sends
        // so that even if the user switches service mid-stream, old bubbles keep correct label
        const modelUsed = service?.name || service?.id || 'AI';
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
        setMessages((prev) => [...prev, { role: 'user', content: userPrompt, tokens_used: 0, cost_usd: 0, model: 'You' }]);

        try {
            if (service.id === 'image_studio') {
                const result = await generateImage(wallet, userPrompt, conversationId);
                setConversationId(result.conversation_id);
                const updated = await getConversationMessages(wallet, result.conversation_id);
                setMessages(updated.messages || []);
            } else {
                const res = service.is_community
                    ? await chatWithAgent(service.id, wallet, userPrompt, conversationId)
                    : await streamChat(service.id, wallet, userPrompt, conversationId, null);
                
                // Add a placeholder message for the assistant — tag with snapshotted model name
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: '', tokens_used: 0, cost_usd: 0, model: modelUsed }
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
                                if (data.error || data.type === 'error') {
                                    throw new Error(data.error || data.message || 'Stream error');
                                }
                                
                                const textChunk = data.chunk || (data.type === 'text' ? data.content : '');
                                if (textChunk) {
                                    fullText += textChunk;
                                    setMessages((prev) => {
                                        const newMsgs = [...prev];
                                        newMsgs[newMsgs.length - 1].content = fullText;
                                        return newMsgs;
                                    });
                                }
                                
                                if (data.done || data.type === 'done') {
                                    const convId = data.conversation_id || conversationId;
                                    setConversationId(convId);
                                    if (service.is_community) {
                                        const updated = await getConversationMessages(wallet, convId);
                                        const serverMsgs = updated.messages || [];
                                        // Merge: server has no model field per-msg, so preserve snapshotted labels
                                        setMessages(prev => serverMsgs.map((sm, i) => ({
                                            ...sm,
                                            model: sm.model || prev[i]?.model || (sm.role === 'assistant' ? modelUsed : 'You')
                                        })));
                                        setTotalTokens(updated.total_tokens || 0);
                                        setTotalCost(updated.total_cost_usd || 0);
                                    } else {
                                        const serverMsgs = data.messages || [];
                                        setMessages(prev => serverMsgs.map((sm, i) => ({
                                            ...sm,
                                            model: sm.model || prev[i]?.model || (sm.role === 'assistant' ? modelUsed : 'You')
                                        })));
                                        setTotalTokens(data.total_tokens_session || 0);
                                        setTotalCost(data.total_cost_session || 0);
                                    }
                                }
                            } catch (e) {
                                if (dataStr.includes('"error"') || dataStr.includes('"message"')) {
                                    throw new Error(e.message || 'Stream error');
                                }
                            }
                        }
                    }
                }
            }

            getConversationHistory(wallet, null).then(setHistory).catch(() => {});
            checkSessionStatus().catch(() => {});
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
        <div className="flex min-h-full flex-col bg-[#f9f9f9] border-r border-gray-200 text-gray-800 p-4">
            <div className="flex items-center justify-between gap-3 mb-6">
                <button 
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex flex-1 items-center gap-3 p-2 rounded-xl hover:bg-gray-200/50 transition-colors text-left min-w-0"
                >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                        {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="truncate text-[13px] font-semibold text-gray-800">{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : 'User Profile'}</p>
                    </div>
                </button>
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm font-bold text-gray-500 transition-colors"
                        aria-label="Close workspace menu"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-0.5 mb-6 border-b border-gray-200 pb-4">
                <button
                    type="button"
                    onClick={() => { navigate('/dashboard/marketplace'); if (isMobile) setIsSidebarOpen(false); }}
                    className="w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center gap-3 text-gray-600 hover:text-gray-900"
                >
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                    </svg>
                    Marketplace
                </button>
                {isCreator && (
                    <>
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/my-agents'); if (isMobile) setIsSidebarOpen(false); }}
                            className="w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center gap-3 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                            </svg>
                            My Agents
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/earnings'); if (isMobile) setIsSidebarOpen(false); }}
                            className="w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium transition-colors flex items-center gap-3 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            Earnings
                        </button>
                    </>
                )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setMessages([]);
                            setConversationId(null);
                            navigate('/dashboard');
                            if (isMobile) setIsSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 rounded-xl transition-all text-[13px] font-medium"
                        title="Start a new chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        New Chat
                    </button>
                </div>
                <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                    {/* Section 1: AI Marketplace History */}
                    {marketplaceRows.length > 0 && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 pl-2">Today</p>
                            </div>
                            <div className="space-y-1">
                                {marketplaceRows.map((row) => (
                                    <div key={row.id} className="relative group flex items-stretch">
                                        <button
                                            type="button"
                                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                            className={`w-full text-left px-2 py-1.5 text-[13px] rounded-lg transition-all pr-8 ${
                                                row.conversationId === conversationId 
                                                ? 'bg-gray-200/60 text-gray-900 font-medium' 
                                                : 'text-gray-600 hover:bg-gray-200/50'
                                            }`}
                                        >
                                            <span className="block truncate pr-6">{row.label}</span>
                                            <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-normal opacity-60">
                                                <span>{row.tokens} tokens</span>
                                                <span>${Number(row.cost).toFixed(4)}</span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteConversation(e, row.conversationId)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md flex items-center justify-center"
                                            title="Delete Chat"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 2: General History */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2 mt-4">
                            <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 pl-2">Previous 7 Days</p>
                        </div>
                        <div className="space-y-1">
                            {generalRows.map((row) => (
                                <div key={row.id} className="relative group flex items-stretch">
                                    <button
                                        type="button"
                                        onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                        className={`w-full text-left px-2 py-1.5 text-[13px] rounded-lg transition-all pr-8 ${
                                            row.conversationId === conversationId 
                                            ? 'bg-gray-200/60 text-gray-900 font-medium' 
                                            : 'text-gray-600 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        <span className="block truncate pr-6">{row.label}</span>
                                        <span className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-normal opacity-60">
                                            <span>{row.tokens} tokens</span>
                                            <span>${Number(row.cost).toFixed(4)}</span>
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteConversation(e, row.conversationId)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md flex items-center justify-center"
                                        title="Delete Chat"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className="w-full rounded-lg hover:bg-gray-100 px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-3"
                    >
                        <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                        Sign out
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
            <div className={`flex animate-fadeUp ${isUser ? 'justify-end px-4 md:px-8' : 'justify-start px-4 md:px-8'} mb-6`}>
                <div
                    className={`max-w-full md:max-w-[80%] text-[15px] transition-all leading-relaxed ${
                        isUser ? 'bg-[#f4f4f4] rounded-[24px] px-5 py-3.5 text-gray-900' : 'bg-transparent py-2 text-gray-800'
                    }`}
                    style={{ animationDelay: `${index * 35}ms` }}
                >
                    {!isUser && (
                        <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                                {msg.model || 'AI'}
                            </span>
                        </div>
                    )}
                    {msg.tokens_used > 0 && !isImage && (
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[11px] font-medium text-gray-400">
                                {msg.tokens_used} tokens · ${msg.cost_usd ? msg.cost_usd.toFixed(6) : '0.000000'}
                            </span>
                        </div>
                    )}

                    {isImage ? (
                        <div className="space-y-4">
                            <img
                                src={imageUrl}
                                alt="Generated AI artwork"
                                className="w-full rounded-xl border border-black/10 object-cover shadow-sm"
                            />
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-xl bg-green-50 text-green-700 border border-green-200 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-green-100 transition-colors"
                                >
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleMintNFT(imageUrl, messages[index - 1]?.content || 'AI image')}
                                    disabled={isMinting || isOptingIn}
                                    className="rounded-xl bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-purple-100 transition-colors disabled:opacity-50"
                                >
                                    {isMinting || isOptingIn ? 'Minting...' : 'Mint as NFT'}
                                </button>
                            </div>
                            {mintedAssetId && (
                                <p className="rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 text-xs font-semibold shadow-sm">
                                    Minted on Algorand Testnet: #{mintedAssetId}
                                </p>
                            )}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                            {msg.content}
                        </pre>
                    )}
                </div>
            </div>
        );
    };

    if (serviceLoading || !service) {
        return (
            <div className="min-h-screen bg-[#f5f5f0] pt-24 text-[#0a0a0a]">
                <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5 text-center">
                        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-black/5 border-t-indigo-500" />
                        <p className="text-lg font-bold text-gray-700">Loading workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] overflow-hidden bg-white font-sans text-gray-800">
            {isSessionModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !isStartingSession && setIsSessionModalOpen(false)} />
                    <div className="animate-fadeUp relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                        {isStartingSession ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-5" />
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                                    {payingStatus || 'Action Required'}
                                </h3>
                                <p className="text-[13px] text-gray-500 max-w-[220px]">
                                    {payingStatus.includes('active') || payingStatus.includes('successful') 
                                        ? 'Your wallet balance has been updated.' 
                                        : 'Please approve the transaction in your Pera Wallet app.'}
                                </p>
                            </div>
                        ) : sessionStatus === 'active' ? (
                            <>
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                    <h2 className="text-[16px] font-semibold text-gray-900">Active Session</h2>
                                    <span className="rounded-full border border-green-200 bg-green-50 text-green-700 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Active
                                    </span>
                                </div>
                                <div className="mb-5 space-y-2">
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Session Balance</p>
                                        <p className="text-2xl font-semibold text-gray-900">{formatMicroAlgo(sessionBalance)} <span className="text-sm font-normal text-gray-500">ALGO</span></p>
                                    </div>
                                    <div className="rounded-xl border border-gray-200 p-4">
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Time Remaining</p>
                                        <p className="text-lg font-semibold text-gray-900">{remainingTime || 'Calculating…'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border border-gray-900 bg-gray-900 text-white py-2.5 text-[13px] font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        {isStartingSession ? 'Waiting…' : '+ Top Up 1 ALGO'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEndSessionAndWithdraw}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-2.5 text-[13px] font-medium text-gray-700 transition-colors"
                                    >
                                        {isStartingSession ? 'Processing…' : 'End Session & Refund'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-[16px] font-semibold text-gray-900 mb-2">Start Smart Session</h2>
                                <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                                    Approve a session to enable automatic micro-payments for 24 hours — no manual approval per message.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Not Now
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="flex-1 rounded-xl border border-gray-900 bg-gray-900 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {isStartingSession ? 'Waiting…' : 'Approve'}
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
                        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                        aria-label="Close profile modal overlay"
                    />
                    <div className="animate-fadeUp relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                        {/* User header */}
                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                            <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-[16px] text-gray-700">
                                {wallet ? wallet.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h2 className="text-[15px] font-semibold text-gray-900">{userProfile?.name || 'Anonymous User'}</h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">{userProfile?.email || 'user@example.com'}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 mb-5">
                            <div className="rounded-xl border border-gray-200 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Tokens Used</p>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[11px] text-gray-400 mb-0.5">Last 30 Days</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.tokens_used_30d || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400 mb-0.5">Total Sessions</p>
                                        <p className="text-xl font-semibold text-gray-900">{userAnalytics?.total_sessions || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-200 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">ALGO Spent</p>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[11px] text-gray-400 mb-0.5">Last 30 Days</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.spent_algo_30d || 0).toFixed(2)} ALGO</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] text-gray-400 mb-0.5">Avg / Session</p>
                                        <p className="text-xl font-semibold text-gray-900">{(userAnalytics?.avg_algo_per_session || 0).toFixed(2)} ALGO</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsProfileModalOpen(false)}
                            className="w-full rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 p-2.5 text-[13px] font-medium transition-colors"
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
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        aria-label="Close workspace menu overlay"
                    />
                    <aside className="animate-slideIn relative w-[270px] overflow-y-auto border-r border-black/10 bg-white p-3 shadow-2xl">
                        <Sidebar isMobile />
                    </aside>
                </div>
            )}

            <div className="grid h-full grid-cols-1 md:grid-cols-[260px_1fr]">
                <aside className="hidden overflow-y-auto border-r border-black/5 bg-white md:block">
                    <Sidebar />
                </aside>

                <main className="flex h-[100dvh] flex-col overflow-hidden relative">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-white/80 backdrop-blur-md p-3 md:px-6">
                            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm md:text-base">
                                <span className="text-base flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-gray-200">{MODEL_ICONS[service?.id] || <span className="text-lg">✨</span>}</span>
                                <span className="truncate font-bold text-gray-800">{service?.name || 'Workspace'}</span>
                                {service && (PROVIDER_BADGE[service.id] ? (
                                    <span className="hidden shrink-0 rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-[10px] font-semibold md:inline">
                                        {PROVIDER_BADGE[service.id].label}
                                    </span>
                                ) : service.is_community ? (
                                    <span className="hidden shrink-0 rounded-full bg-purple-50 text-purple-600 px-2.5 py-0.5 text-[10px] font-semibold md:inline">
                                        Community · {service.provider}
                                    </span>
                                ) : null)}
                                <span className="hidden text-gray-300 md:inline">•</span>
                                
                                {service?.is_community && service?.creator_wallet === wallet ? (
                                    <div 
                                        className="flex items-center gap-1.5 rounded-lg bg-purple-100 text-purple-700 px-3 py-1.5 text-xs font-bold cursor-default animate-pulse"
                                    >
                                        ✨ Creator Mode (Free)
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => setIsSessionModalOpen(true)}
                                        className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[10px] md:text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                            sessionStatus === 'active' 
                                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' 
                                                : (sessionStatus === 'expired' || sessionStatus === 'limit_exceeded') 
                                                ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' 
                                                : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20'
                                        }`}
                                    >
                                        <span className="hidden md:inline">Smart Session:</span>
                                        <span>
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
                                )}
                            </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="relative rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-700 transition-colors md:hidden"
                            >
                                Menu
                            </button>
                        </div>
                    </div>

                    {(payingStatus || error) && (
                        <div
                            className={`mx-4 mt-4 shrink-0 rounded-xl p-3 text-sm font-medium border shadow-sm ${
                                error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <span className="text-lg">{error ? '🚫' : '⏳'}</span>
                                <span className="flex-1">{error || payingStatus}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    {error && service?.is_community && service?.creator_wallet === wallet && (
                                        error.toLowerCase().includes('api key') || error.toLowerCase().includes('api_key') ||
                                        error.toLowerCase().includes('quota') || error.toLowerCase().includes('expired') ||
                                        error.toLowerCase().includes('failed') || error.toLowerCase().includes('not found') ||
                                        error.toLowerCase().includes('429') || error.toLowerCase().includes('invalid')
                                    ) && (
                                        <button
                                            type="button"
                                            onClick={() => setIsApiKeyModalOpen(true)}
                                            className="rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 text-xs font-semibold hover:bg-yellow-200 transition-colors"
                                        >
                                            🔐 Update API Key
                                        </button>
                                    )}
                                    {error && (
                                        <button 
                                            type="button" 
                                            onClick={() => setError(null)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors" 
                                            aria-label="Dismiss error"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto p-2 pb-4 md:p-4">
                        {messages.length === 0 && !isLoading && service?.is_community ? (
                        <div className="flex flex-col min-h-full items-center justify-center py-10 max-w-xl mx-auto w-full px-6">
                                <div className="border border-gray-200 rounded-2xl p-8 w-full animate-fadeUp">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-2xl">
                                            {CATEGORY_EMOJIS[service.category] || '🤖'}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">{service.name}</h2>
                                            <p className="text-xs text-gray-400">{service.provider} · {service.model}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="rounded-full border border-gray-200 text-gray-600 px-3 py-1 text-xs">
                                            {service.creator_name || 'Creator'}
                                        </span>
                                        <span className="rounded-full border border-gray-200 text-gray-600 px-3 py-1 text-xs">
                                            {service.pricing_model === 'per_request' ? `${service.price_algo.toFixed(2)} ALGO / request` : 'Per Token Billing'}
                                        </span>
                                        <span className="rounded-full border border-gray-200 text-gray-600 px-3 py-1 text-xs capitalize">
                                            {service.category?.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="text-[13px] text-gray-500 leading-relaxed border-t border-gray-100 pt-5 mb-5">
                                        {service.description}
                                    </p>

                                    <p className="text-xs text-gray-400">Type your message below to begin.</p>
                                </div>
                            </div>
                        ) : messages.length === 0 && !isLoading && (
                            <div className="flex flex-col min-h-full items-center justify-center py-6 max-w-4xl mx-auto w-full px-4">
                                <div className="text-center mb-10 animate-fadeUp">
                                    <h2 className="text-[1.75rem] md:text-[2.25rem] font-semibold text-gray-800 tracking-tight mb-1">
                                        Hello, {userProfile?.name?.split(' ')[0] || (wallet ? wallet.slice(0,6) : 'there')} 👋
                                    </h2>
                                    <p className="text-gray-400 text-[15px]">Choose a model below and start chatting</p>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl animate-fadeUp delay-100 mx-auto mb-4">
                                    {allServices.filter(s => ['llama3', 'gpt4o_mini', 'gemini_flash', 'qwen25'].includes(s?.id)).map((s) => {
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                    setService(s);
                                                    setMessages([]);
                                                    setConversationId(null);
                                                }}
                                                className={`rounded-2xl p-4 text-left transition-all border ${
                                                    s.id === service?.id 
                                                    ? 'border-gray-400 bg-gray-50' 
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                                                        {MODEL_ICONS[s.id] || (
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg">✨</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-gray-800">{MODEL_LABELS[s.id] || s.name.split(' ')[0]}</p>
                                                        <p className="text-[11px] text-gray-400">{PROVIDER_BADGE[s.id]?.label || ''}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <MessageBubble key={`${msg.role}-${index}-${msg.content?.slice?.(0, 12) || index}`} msg={msg} index={index} />
                        ))}

                        {isLoading && (
                            <div className="px-4 md:px-8">
                                <div className="w-fit text-sm text-gray-500 py-2">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                                        </span>
                                        {payingStatus || ''}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="sticky bottom-0 shrink-0 bg-transparent p-2 md:p-6 pb-6">
                        {(sessionStatus !== 'active' && service?.creator_wallet !== wallet) ? (
                        <div
                                onClick={() => setIsSessionModalOpen(true)}
                                className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-all active:scale-[0.99] animate-fadeUp"
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Session required</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Start a session to chat with this agent.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-full border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                                >
                                    Start Session
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendPrompt} className="relative mx-auto w-full max-w-3xl bg-[#f4f4f4] rounded-[24px] border border-gray-200 p-1.5 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
                                <div className="flex flex-col">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={messages.length === 0 ? 'Message AI...' : 'Reply...'}
                                        className="min-h-[52px] max-h-40 w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] outline-none custom-scrollbar text-gray-800 placeholder-gray-500"
                                        disabled={isLoading}
                                        maxLength={2000}
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendPrompt(e);
                                            }
                                        }}
                                    />
                                    
                                    <div className="flex items-center justify-between px-2 pt-1 pb-1">
                                        <div className="flex items-center gap-1.5">
                                            {/* No quick prompts per user request */}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                        {service?.is_community ? (
                                            <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 px-3 text-[12px] font-medium md:flex">
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" /></svg>
                                                {service.name.length > 16 ? service.name.slice(0, 14) + '…' : service.name}
                                            </div>
                                        ) : (
                                            <div className="relative hidden md:block">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                                    disabled={isLoading}
                                                    className={`h-8 flex items-center gap-2 cursor-pointer rounded-lg border bg-white pl-3 pr-2.5 text-[12px] font-medium text-gray-700 outline-none hover:border-gray-300 transition-colors ${isModelDropdownOpen ? 'border-gray-400 shadow-sm' : 'border-gray-200'}`}
                                                >
                                                    {service ? (MODEL_LABELS[service.id] || service.name) : 'Select Model'}
                                                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                
                                                {isModelDropdownOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                                                        <div className="absolute right-0 bottom-full mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeUp origin-bottom-right">
                                                            <div className="p-1.5 flex flex-col gap-0.5">
                                                                {allServices.filter(s => ['llama3', 'gpt4o_mini', 'gemini_flash', 'qwen25'].includes(s?.id)).map((s) => {
                                                                    const badge = PROVIDER_BADGE[s.id];
                                                                    return (
                                                                        <button
                                                                            key={s.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setService(s);
                                                                                setIsModelDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-[12px] transition-colors ${service?.id === s.id ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-80">{MODEL_ICONS[s.id]}</span>
                                                                                {MODEL_LABELS[s.id] || s.name}
                                                                            </span>
                                                                            {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badge.color} text-gray-800 font-semibold tracking-wide border border-black/5 shadow-sm`}>{badge.label}</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
     
                                        <button
                                            type="submit"
                                            disabled={isLoading || !prompt.trim()}
                                            className={`h-[34px] w-[34px] flex items-center justify-center rounded-full transition-all ${
                                                prompt.trim() && !isLoading 
                                                ? 'bg-black text-white hover:bg-gray-800' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                            )}
                                        </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>

            {/* Agent-specific API Key Update Modal — only shown to creator */}
            {isApiKeyModalOpen && service?.is_community && service?.creator_wallet === wallet && (() => {
                const agentProvider = service?.provider || 'gemini';
                const agentModel = service?.model || '';
                const existingKey = keyStatusList.find(k => k.provider === agentProvider);
                const providerLabel = {
                    gemini: 'Google Gemini', openai: 'OpenAI', groq: 'Groq', huggingface: 'HuggingFace',
                }[agentProvider] || agentProvider;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md animate-fadeUp rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
                            <div className="mb-5 flex items-center justify-between pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                        Update API Key
                                    </h2>
                                    <p className="text-[12px] text-gray-400 mt-0.5">For agent: {service.name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {keySuccessMessage && (
                                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-[13px] text-green-700">{keySuccessMessage}</div>
                            )}
                            {keyErrorMessage && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-600">{keyErrorMessage}</div>
                            )}

                            <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Agent Configuration</p>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{providerLabel}</span>
                                    <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-medium text-gray-700">{agentModel}</span>
                                    <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5 ${existingKey ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${existingKey ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                        {existingKey ? `Key set (${existingKey.key_hint})` : 'No key saved'}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                                    {providerLabel} API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder={`sk-... or AIza... — your ${agentProvider} key`}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 outline-none focus:border-gray-400 bg-white transition-colors"
                                    autoComplete="off"
                                />
                                <p className="text-[11px] text-gray-400 mt-2">
                                    Encrypted with AES-256-GCM. Never stored in plaintext.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="flex-1 rounded-lg border border-gray-200 p-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingKey || !apiKeyInput.trim()}
                                    onClick={handleSaveWorkspaceKey}
                                    className="flex-1 rounded-lg border border-gray-900 bg-gray-900 p-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {isSavingKey ? 'Saving…' : 'Save & Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
