import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // Refresh V3
import { useNavigate, useParams } from 'react-router-dom';
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
    getCreatorProfile,
    getCreatorAgents,
    getAgentDetails,
    chatWithAgent,
    saveCreatorApiKey,
    getApiKeyStatus,
    createCreatorProfile,
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
        const msg = (e?.message || '').toLowerCase();
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
        try {
            setIsStartingSession(true);
            setError(null);

            const { PeraWalletConnect } = await import('@perawallet/connect');
            const algosdk = (await import('algosdk')).default;

            if (!peraWalletRef.current) {
                peraWalletRef.current = new PeraWalletConnect({ shouldShowSignTxnToast: true });
            }
            const pw = peraWalletRef.current;

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
            const signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);

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
            if (e.message?.includes('timeout') || e.message?.includes('Confirmation took too long')) {
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
        }
    };

    const handleEndSessionAndWithdraw = async () => {
        try {
            setIsStartingSession(true);
            setError(null);
            const { PeraWalletConnect } = await import('@perawallet/connect');
            const algosdk = (await import('algosdk')).default;

            if (!peraWalletRef.current) {
                peraWalletRef.current = new PeraWalletConnect({ shouldShowSignTxnToast: true });
            }
            const pw = peraWalletRef.current;
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
            const signed = await pw.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);

            setPayingStatus('Processing refund...');
            const { txId } = await client.sendRawTransaction(signed).do();
            await algosdk.waitForConfirmation(client, txId, 4);

            setSessionStatus('inactive');
            setSessionBalance(0);
            setIsSessionModalOpen(false);
            setPayingStatus('Refund successful! Session ended. 💸');
            setTimeout(() => {
                setPayingStatus('');
            }, 2500);

            // Sync with blockchain after 3 seconds
            setTimeout(() => {
                checkSessionStatus().catch(() => {});
            }, 3000);

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

            <div className="mt-4 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => { navigate('/dashboard/marketplace'); if (isMobile) setIsSidebarOpen(false); }}
                    className="w-full rounded-xl border-2 border-[#111] bg-purple-200 p-2.5 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none md:border-4 flex items-center gap-2"
                >
                    <span>🤖</span> AI Marketplace
                </button>
                {isCreator && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/my-agents'); if (isMobile) setIsSidebarOpen(false); }}
                            className="flex-1 rounded-xl border-2 border-[#111] bg-green-200 p-2 text-xs font-black shadow-[3px_3px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center justify-center gap-1"
                        >
                            📦 My Agents
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/dashboard/earnings'); if (isMobile) setIsSidebarOpen(false); }}
                            className="flex-1 rounded-xl border-2 border-[#111] bg-yellow-200 p-2 text-xs font-black shadow-[3px_3px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center justify-center gap-1"
                        >
                            💰 Earnings
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-xs uppercase tracking-widest opacity-60">Chat History</p>
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
                <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1">
                    {/* Section 1: AI Marketplace History */}
                    {marketplaceRows.length > 0 && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="font-black text-[10px] uppercase tracking-widest opacity-50">AI Marketplace History</p>
                                <span className="rounded-full bg-purple-200 border-2 border-[#111] px-2 py-0.5 text-[9px] font-black text-[#111]">{marketplaceRows.length}</span>
                            </div>
                            <div className="space-y-2">
                                {marketplaceRows.map((row) => (
                                    <div key={row.id} className="relative group flex items-stretch">
                                        <button
                                            type="button"
                                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                            className={`w-full rounded-xl border-2 border-[#111] p-2 text-left text-sm shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-1 md:border-4 ${
                                                row.conversationId === conversationId ? 'bg-purple-200' : 'bg-white'
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
                        </div>
                    )}

                    {/* Section 2: General History */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="font-black text-[10px] uppercase tracking-widest opacity-50">General History</p>
                            <span className="rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-black text-white">{generalRows.length}</span>
                        </div>
                        <div className="space-y-2">
                            {generalRows.map((row) => (
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
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t-2 md:border-t-4 border-[#111] flex flex-col gap-2">
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
                            {isUser ? 'You' : (msg.model || 'AI')}
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
                        {isStartingSession ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <div className="relative mb-6">
                                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-[#111] border-t-neo-blue" />
                                    <span className="absolute inset-0 flex items-center justify-center text-xl">⏳</span>
                                </div>
                                <h3 className="text-base font-black mb-1">
                                    {payingStatus || 'Action Required'}
                                </h3>
                                <p className="text-xs font-bold opacity-60 max-w-[220px]">
                                    {payingStatus.includes('active') || payingStatus.includes('successful') 
                                        ? 'Your wallet balance has been updated!' 
                                        : 'Please approve the transaction in your Pera Wallet app.'}
                                </p>
                            </div>
                        ) : sessionStatus === 'active' ? (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-black">⚡ Active Session</h2>
                                    <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-black border border-[#111]">ACTIVE</span>
                                </div>
                                <div className="mb-6 space-y-3">
                                    <div className="rounded-xl border-2 border-[#111] bg-yellow-100 p-3 shadow-[3px_3px_0px_#111]">
                                        <p className="text-[10px] font-black uppercase opacity-60">Session Balance</p>
                                        <p className="text-xl font-black">{formatMicroAlgo(sessionBalance)} ALGO</p>
                                    </div>
                                    <div className="rounded-xl border-2 border-[#111] bg-cyan-100 p-3 shadow-[3px_3px_0px_#111]">
                                        <p className="text-[10px] font-black uppercase opacity-60">Time Remaining</p>
                                        <p className="text-sm font-black">{remainingTime || 'Calculating...'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={handleStartSession}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border-2 border-[#111] bg-green-200 py-3 text-sm font-black shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none"
                                    >
                                        {isStartingSession ? 'Waiting...' : '+ Top Up 1 ALGO'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEndSessionAndWithdraw}
                                        disabled={isStartingSession}
                                        className="w-full rounded-xl border-2 border-[#111] bg-pink-200 py-3 text-sm font-black shadow-[4px_4px_0px_#111] active:translate-y-1 active:shadow-none"
                                    >
                                        {isStartingSession ? 'Processing...' : 'End Session & Refund'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSessionModalOpen(false)}
                                        className="w-full text-center text-xs font-black opacity-40 hover:opacity-100 py-2"
                                    >
                                        Close
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
                                {service && (PROVIDER_BADGE[service.id] ? (
                                    <span className={`hidden shrink-0 rounded-full border border-[#111] px-2 py-0.5 text-[9px] font-black md:inline ${PROVIDER_BADGE[service.id].color}`}>
                                        {PROVIDER_BADGE[service.id].label}
                                    </span>
                                ) : service.is_community ? (
                                    <span className="hidden shrink-0 rounded-full border border-[#111] bg-purple-200 px-2 py-0.5 text-[9px] font-black md:inline">
                                        Community · {service.provider}
                                    </span>
                                ) : null)}
                                <span className="hidden opacity-30 md:inline">•</span>
                                
                                {service?.is_community && service?.creator_wallet === wallet ? (
                                    <div 
                                        className="flex items-center gap-1.5 rounded-lg border-2 border-[#111] bg-purple-200 px-2 py-1 text-[10px] shadow-[2px_2px_0px_#111] md:text-xs font-black cursor-default animate-pulse"
                                    >
                                        ✨ Creator Mode (Free)
                                    </div>
                                ) : (
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
                                )}
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
                                            className="rounded-lg border-2 border-[#111] bg-yellow-200 px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                        >
                                            🔐 Update API Key
                                        </button>
                                    )}
                                    {error && (
                                        <button 
                                            type="button" 
                                            onClick={() => setError(null)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#111] bg-white hover:bg-[#111] hover:text-white transition-colors font-black" 
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
                            <div className="flex flex-col min-h-full items-center justify-center py-6 max-w-2xl mx-auto w-full px-4">
                                <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111] w-full text-center animate-fadeUp">
                                    <div className="w-20 h-20 rounded-2xl border-4 border-[#111] bg-purple-100 flex items-center justify-center text-4xl shadow-[4px_4px_0px_#111] mx-auto mb-4">
                                        {CATEGORY_EMOJIS[service.category] || '🤖'}
                                    </div>
                                    <h2 className="text-3xl font-black text-neo-blue mb-1">{service.name}</h2>
                                    <p className="text-xs font-black uppercase tracking-wider opacity-50 mb-3">
                                        Powered by {service.provider} · {service.model}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                                        <span className="rounded-full border-2 border-[#111] bg-cyan-100 px-3 py-1 text-xs font-black">
                                            👤 {service.creator_name || 'Creator'}
                                        </span>
                                        <span className="rounded-full border-2 border-[#111] bg-green-200 px-3 py-1 text-xs font-black">
                                            💰 {service.pricing_model === 'per_request' ? `${service.price_algo.toFixed(2)} ALGO / request` : 'Per Token Billing'}
                                        </span>
                                        <span className="rounded-full border-2 border-[#111] bg-purple-200 px-3 py-1 text-xs font-black capitalize">
                                            🏷️ {service.category?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm font-bold opacity-75 border-2 border-dashed border-[#111] rounded-xl p-4 bg-yellow-50 text-left mb-6 whitespace-pre-wrap leading-relaxed">
                                        {service.description}
                                    </p>
                                    
                                    <div className="text-center font-bold text-xs opacity-60">
                                        👇 Type your query below to start using this AI Agent!
                                    </div>
                                </div>
                            </div>
                        ) : messages.length === 0 && !isLoading && (
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
                        {(sessionStatus !== 'active' && service?.creator_wallet !== wallet) ? (
                            <div 
                                onClick={() => setIsSessionModalOpen(true)}
                                className="flex items-center justify-between gap-4 rounded-xl border-2 border-[#111] bg-yellow-100 p-3 md:border-4 cursor-pointer hover:bg-yellow-200 transition-all shadow-[4px_4px_0px_#111] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none animate-fadeUp"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">🔒</span>
                                    <div>
                                        <p className="text-xs font-black text-[#111] uppercase tracking-wide">Session Locked</p>
                                        <p className="text-[10px] font-bold text-zinc-600 leading-snug">Start a pay-per-use smart session to chat with this agent.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="rounded-lg border-2 border-[#111] bg-neo-blue px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0px_#111] active:translate-y-0.5 active:shadow-none whitespace-nowrap"
                                >
                                    🔑 Start Session
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendPrompt} className="flex items-center gap-2 rounded-xl border-2 border-[#111] bg-white p-2 md:border-4">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={messages.length === 0 ? 'Type prompt...' : 'Type a follow-up...'}
                                    className="h-11 min-w-0 flex-1 resize-none rounded-lg border-2 border-[#111] bg-white px-3 py-2 text-sm outline-none md:h-12 md:border-4 md:text-base"
                                    disabled={isLoading}
                                    maxLength={2000}
                                />
                                
                                <div className="flex items-center gap-2">
                                    {service?.is_community ? (
                                        <div className="hidden h-11 items-center rounded-lg border-2 border-[#111] bg-yellow-200 px-3 text-xs font-black shadow-[3px_3px_0px_#111] md:flex md:h-12 md:border-4 md:px-4 md:text-sm">
                                            🤖 {service.name.length > 15 ? service.name.slice(0, 13) + '...' : service.name}
                                        </div>
                                    ) : (
                                        <select
                                            value={service?.id || ''}
                                            onChange={(e) => {
                                                const selected = allServices.find(s => s.id === e.target.value);
                                                if (selected) {
                                                    setService(selected);
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
                                    )}
 
                                    <button
                                        type="submit"
                                        disabled={isLoading || !prompt.trim()}
                                        className="h-11 whitespace-nowrap rounded-lg border-2 border-[#111] bg-green-200 px-4 text-sm font-black shadow-[3px_3px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:border-4 md:px-5 md:text-base"
                                    >
                                        {isLoading ? 'Wait...' : 'Send'}
                                    </button>
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
                    gemini: 'Google Gemini',
                    openai: 'OpenAI',
                    groq: 'Groq',
                    huggingface: 'HuggingFace',
                }[agentProvider] || agentProvider;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md animate-fadeUp rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                            {/* Header */}
                            <div className="mb-5 flex items-center justify-between border-b-4 border-[#111] pb-3">
                                <div>
                                    <h2 className="text-lg font-black flex items-center gap-2">🔐 Update API Key
                                    </h2>
                                    <p className="text-xs font-bold opacity-50 mt-0.5">For agent: {service.name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#111] bg-pink-100 hover:bg-[#111] hover:text-white transition-all font-black shadow-[2px_2px_0px_#111]"
                                >
                                    ✕
                                </button>
                            </div>

                            {keySuccessMessage && (
                                <div className="mb-4 rounded-xl border-2 border-green-500 bg-green-100 p-3 text-sm font-black text-green-700 flex items-center gap-2">
                                    <span>✅</span> {keySuccessMessage}
                                </div>
                            )}
                            {keyErrorMessage && (
                                <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-100 p-3 text-sm font-black text-red-700">
                                    {keyErrorMessage}
                                </div>
                            )}

                            {/* Agent Info — locked, not editable */}
                            <div className="mb-4 rounded-xl border-2 border-[#111] bg-[#fff7df] p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Agent Configuration</p>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-lg border-2 border-[#111] bg-purple-200 px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#111] uppercase">
                                        {providerLabel}
                                    </span>
                                    <span className="rounded-lg border-2 border-[#111] bg-yellow-100 px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_#111]">
                                        {agentModel}
                                    </span>
                                    <span className={`ml-auto rounded-full border-2 border-[#111] px-2.5 py-1 text-[10px] font-black ${existingKey ? 'bg-green-200' : 'bg-red-100'}`}>
                                        {existingKey ? `🟢 Key set (${existingKey.key_hint})` : '🔴 No key'}
                                    </span>
                                </div>
                            </div>

                            {/* Key input */}
                            <div className="mb-4">
                                <label className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1.5">
                                    Paste your fresh {providerLabel} API key
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder={`sk-... or AIza... — your ${agentProvider} key`}
                                    className="w-full rounded-xl border-2 border-[#111] px-3 py-2.5 text-sm font-bold shadow-[3px_3px_0px_#111] outline-none focus:bg-yellow-50 bg-white transition-all"
                                    autoComplete="off"
                                />
                            </div>

                            <p className="text-[11px] font-bold opacity-50 leading-relaxed mb-4">
                                🔒 Encrypted with AES-256-GCM. Your key is never stored in plaintext or logged anywhere.
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsApiKeyModalOpen(false); setKeyErrorMessage(''); setKeySuccessMessage(''); setApiKeyInput(''); }}
                                    className="flex-1 rounded-xl border-2 border-[#111] bg-white p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSavingKey || !apiKeyInput.trim()}
                                    onClick={handleSaveWorkspaceKey}
                                    className="flex-1 rounded-xl border-2 border-[#111] bg-purple-300 p-3 text-sm font-black shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingKey ? 'Encrypting...' : '🔐 Save & Activate'}
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
