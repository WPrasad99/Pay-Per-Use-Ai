import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    depositWalletFunds,
    generateImage,
    getConversationHistory,
    getConversationMessages,
    getPaymentInfo,
    getServices,
    getWalletPrepayBalance,
    mintNFT,
    sendChat,
    transferNFT,
} from '../api/client';

const ICONS = {
    code_review: '🔍',
    image_studio: '🎨',
    business_evaluator: '💡',
    cold_email: '📧',
    humanize_text: '🤖',
    linkedin_post: '📝',
};

const MODELS = [
    { id: 'turbo', name: 'Turbo', note: 'Fast drafts', badge: 'Popular' },
    { id: 'pro', name: 'Pro', note: 'Balanced quality', badge: 'Default' },
    { id: 'deep', name: 'Deep', note: 'Complex tasks', badge: 'Precise' },
];

const QUICK_PROMPTS = [
    'Summarize the main trade-offs in bullet points.',
    'Turn this into a polished SaaS landing page section.',
    'Review this and suggest the highest-impact improvements.',
];

const ALGOD_API = 'https://testnet-api.algonode.cloud';

const formatMicroAlgo = (microAlgo) => (Number(microAlgo || 0) / 1_000_000).toFixed(3);

const WorkspacePage = () => {
    const { serviceId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const wallet = sessionStorage.getItem('wallet_address');
    const messagesEndRef = useRef(null);

    const [service, setService] = useState(location.state?.service || null);
    const [serviceLoading, setServiceLoading] = useState(!location.state?.service);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPaid, setIsPaid] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [balance, setBalance] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [history, setHistory] = useState([]);
    const [payingStatus, setPayingStatus] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositInput, setDepositInput] = useState('1');
    const [isMinting, setIsMinting] = useState(false);
    const [mintedAssetId, setMintedAssetId] = useState(null);
    const [isOptingIn, setIsOptingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[1].id);

    const fetchBalance = useCallback(async (address) => {
        try {
            const data = await getWalletPrepayBalance(address);
            return data.balance_microalgo || 0;
        } catch (e) {
            console.warn('Balance fetch failed:', e);
            return 0;
        }
    }, []);

    useEffect(() => {
        if (!wallet) {
            navigate('/');
            return;
        }

        if (!service) {
            setServiceLoading(true);
            getServices()
                .then((services) => {
                    const found = services.find((s) => s.id === serviceId);
                    if (found) setService(found);
                    else navigate('/services');
                })
                .catch(() => navigate('/services'))
                .finally(() => setServiceLoading(false));
        }
    }, [wallet, service, serviceId, navigate]);

    useEffect(() => {
        if (!service || !wallet) return;
        getPaymentInfo(service.id).then(setPaymentInfo).catch(() => {});
        fetchBalance(wallet).then(setBalance).catch(() => {});
        getConversationHistory(wallet, service.id).then(setHistory).catch(() => {});
    }, [service, wallet, fetchBalance]);

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
                setIsPaid(true);
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
            return [
                { id: 'draft', label: 'Draft workspace', tokens: 840, cost: 0.012, date: 'Preview' },
                { id: 'review', label: 'Quality pass', tokens: 1260, cost: 0.019, date: 'Preview' },
            ];
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

    const selectedModelCopy = MODELS.find((model) => model.id === selectedModel) || MODELS[1];

    const handleDeposit = async () => {
        try {
            setIsDepositing(true);
            setError(null);

            const { PeraWalletConnect } = await import('@perawallet/connect');
            const algosdk = (await import('algosdk')).default;

            let toAddr = paymentInfo?.contract_address;
            if (!toAddr) {
                const freshInfo = await getPaymentInfo(service.id);
                setPaymentInfo(freshInfo);
                toAddr = freshInfo?.contract_address;
            }

            const pw = new PeraWalletConnect();
            let accounts = [];
            try {
                accounts = await pw.reconnectSession();
            } catch (_) {}
            if (!accounts || !accounts.length) accounts = await pw.connect();
            if (accounts[0] !== wallet) throw new Error('Wallet mismatch. Please reconnect the correct wallet.');

            const algodClient = new algosdk.Algodv2('', ALGOD_API, '');
            const params = await algodClient.getTransactionParams().do();

            const parsedAlgo = parseFloat(depositInput);
            if (Number.isNaN(parsedAlgo) || parsedAlgo <= 0) throw new Error('Invalid deposit amount');

            const amountMicro = Math.floor(parsedAlgo * 1_000_000);
            const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: wallet,
                receiver: toAddr,
                amount: amountMicro,
                suggestedParams: params,
            });

            const method = new algosdk.ABIMethod({
                name: 'deposit',
                args: [{ type: 'pay', name: 'payment' }],
                returns: { type: 'uint64' },
            });

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({
                addr: wallet,
                sk: new Uint8Array(64),
            });

            const atc = new algosdk.AtomicTransactionComposer();
            atc.addMethodCall({
                appID: parseInt(paymentInfo.app_id),
                method,
                methodArgs: [{ txn: payTxn, signer: dummySigner }],
                sender: wallet,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [
                    {
                        appIndex: parseInt(paymentInfo.app_id),
                        name: new Uint8Array([
                            ...new TextEncoder().encode('b_'),
                            ...algosdk.decodeAddress(wallet).publicKey,
                        ]),
                    },
                ],
            });

            const sessionMethod = new algosdk.ABIMethod({
                name: 'start_session',
                args: [
                    { type: 'uint64', name: 'max_spend' },
                    { type: 'uint64', name: 'expiry_time' },
                ],
                returns: { type: 'bool' },
            });

            const expiryTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
            const maxSpend = 1000000000000;

            atc.addMethodCall({
                appID: parseInt(paymentInfo.app_id),
                method: sessionMethod,
                methodArgs: [maxSpend, expiryTime],
                sender: wallet,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [
                    {
                        appIndex: parseInt(paymentInfo.app_id),
                        name: new Uint8Array([
                            ...new TextEncoder().encode('sb_'),
                            ...algosdk.decodeAddress(wallet).publicKey,
                        ]),
                    },
                    {
                        appIndex: parseInt(paymentInfo.app_id),
                        name: new Uint8Array([
                            ...new TextEncoder().encode('se_'),
                            ...algosdk.decodeAddress(wallet).publicKey,
                        ]),
                    },
                    {
                        appIndex: parseInt(paymentInfo.app_id),
                        name: new Uint8Array([
                            ...new TextEncoder().encode('b_'),
                            ...algosdk.decodeAddress(wallet).publicKey,
                        ]),
                    },
                ],
            });

            const group = atc.buildGroup().map((t) => t.txn);
            const txId = group[0].txID().toString();

            const signed = await pw.signTransaction([group.map((txn) => ({ txn, signers: [wallet] }))]);
            await algodClient.sendRawTransaction(signed).do();

            setPayingStatus('Verifying your deposit on the Algorand Testnet...');
            await algosdk.waitForConfirmation(algodClient, txId, 4);

            setPayingStatus('Syncing balance...');
            await new Promise((resolve) => setTimeout(resolve, 3000));

            await depositWalletFunds(wallet, txId);
            const bal = await fetchBalance(wallet);
            setBalance(bal);
            setPayingStatus('');
        } catch (e) {
            setError(e.message || 'Deposit failed');
            setPayingStatus('');
        } finally {
            setIsDepositing(false);
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
        setIsPaid(true);
        setPayingStatus(
            service.id === 'image_studio'
                ? `Generating AI art with ${selectedModelCopy.name} mode...`
                : `Running ${selectedModelCopy.name} mode...`
        );
        setMessages((prev) => [...prev, { role: 'user', content: userPrompt, tokens_used: 0, cost_usd: 0 }]);

        try {
            if (service.id === 'image_studio') {
                const result = await generateImage(wallet, userPrompt, conversationId);
                setConversationId(result.conversation_id);

                const updated = await getConversationMessages(wallet, result.conversation_id);
                setMessages(updated.messages || []);
                setBalance((prev) => Math.max(0, prev - 2000000));
            } else {
                const result = await sendChat(service.id, wallet, userPrompt, conversationId, null);
                setConversationId(result.conversation_id);
                setMessages(result.messages || []);
                setTotalTokens(result.total_tokens_session || 0);
                setTotalCost(result.total_cost_session || 0);

                const algoPriceUsd = 0.2;
                const sessionCostAlgo = (result.total_cost_session || 0) / algoPriceUsd;
                const sessionCostMicroAlgo = Math.round(sessionCostAlgo * 1_000_000);

                fetchBalance(wallet)
                    .then((realBalance) => {
                        setBalance(Math.max(0, realBalance - sessionCostMicroAlgo));
                    })
                    .catch(() => {});
            }

            getConversationHistory(wallet, service.id).then(setHistory).catch(() => {});
        } catch (err) {
            setError(err.message || 'Request failed');
            setMessages((prev) => prev.slice(0, -1));
            setPrompt(userPrompt);
        } finally {
            setIsLoading(false);
            setPayingStatus('');
        }
    };

    const Sidebar = ({ isMobile = false }) => (
        <aside
            className={`flex h-full flex-col border-4 border-neo-ink bg-white p-4 shadow-[8px_8px_0_#111111] ${
                isMobile ? 'rounded-l-[2rem]' : 'rounded-[2rem]'
            }`}
        >
            <div className="flex items-start justify-between gap-3 border-b-4 border-neo-ink pb-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neo-blue">Workspace</p>
                    <h2 className="mt-1 text-xl font-black text-neo-ink">Control Room</h2>
                </div>
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="rounded-full border-4 border-neo-ink bg-neo-pink px-3 py-1 font-black text-neo-ink shadow-[4px_4px_0_#111]"
                        aria-label="Close workspace menu"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="mt-5 rounded-[1.5rem] border-4 border-neo-ink bg-neo-yellow p-4 shadow-[6px_6px_0_#111111]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neo-ink/70">User plan</p>
                        <h3 className="text-2xl font-black text-neo-ink">Creator</h3>
                    </div>
                    <span className="rounded-full border-4 border-neo-ink bg-white px-3 py-1 text-xs font-black text-neo-ink">
                        Live
                    </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black text-neo-ink">
                    <div className="rounded-2xl border-4 border-neo-ink bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] opacity-60">Balance</p>
                        <p>{formatMicroAlgo(balance)} ALGO</p>
                    </div>
                    <div className="rounded-2xl border-4 border-neo-ink bg-white p-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] opacity-60">Sessions</p>
                        <p>{history.length}</p>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border-4 border-neo-ink bg-[#c8b6ff] p-4 shadow-[6px_6px_0_#111111]">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-neo-ink">Model selector</h3>
                    <span className="text-xl">⚙️</span>
                </div>
                <div className="space-y-2">
                    {MODELS.map((model) => (
                        <button
                            key={model.id}
                            type="button"
                            onClick={() => setSelectedModel(model.id)}
                            className={`w-full rounded-2xl border-4 border-neo-ink p-3 text-left transition-all ${
                                selectedModel === model.id
                                    ? 'translate-x-[-2px] translate-y-[-2px] bg-white shadow-[6px_6px_0_#111111]'
                                    : 'bg-white/60 hover:bg-white'
                            }`}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="font-black text-neo-ink">{model.name}</span>
                                <span className="rounded-full border-2 border-neo-ink bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase text-neo-ink">
                                    {model.badge}
                                </span>
                            </span>
                            <span className="text-xs font-bold text-neo-ink/60">{model.note}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex-1 overflow-hidden rounded-[1.5rem] border-4 border-neo-ink bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-neo-ink">Usage history</h3>
                    <span className="rounded-full bg-neo-ink px-2 py-1 text-[10px] font-black text-white">{usageRows.length}</span>
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {usageRows.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                            className={`w-full rounded-2xl border-4 border-neo-ink p-3 text-left transition-all hover:-translate-y-0.5 ${
                                row.conversationId === conversationId ? 'bg-neo-green shadow-[5px_5px_0_#111]' : 'bg-[#fff7df]'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-black text-neo-ink">{row.label}</p>
                                <p className="text-xs font-black text-neo-blue">${Number(row.cost).toFixed(4)}</p>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-neo-ink/60">
                                <span>{row.tokens} tokens</span>
                                <span>{row.date}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );

    const MessageBubble = ({ msg, index }) => {
        const isUser = msg.role === 'user';
        const isImage = typeof msg.content === 'string' && msg.content.startsWith('[IMAGE]');
        const imageUrl = isImage ? msg.content.replace('[IMAGE]', '') : '';

        return (
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`max-w-[92%] rounded-[1.5rem] border-4 border-neo-ink p-4 shadow-[6px_6px_0_#111111] md:max-w-[78%] ${
                        isUser ? 'bg-neo-yellow text-neo-ink' : 'bg-white text-neo-ink'
                    }`}
                    style={{ animationDelay: `${index * 35}ms` }}
                >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border-2 border-neo-ink bg-neo-ink px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                            {isUser ? 'You' : selectedModelCopy.name}
                        </span>
                        {msg.tokens_used > 0 && !isImage && (
                            <span className="text-[11px] font-black text-neo-ink/60">
                                {msg.tokens_used} tokens · ${msg.cost_usd ? msg.cost_usd.toFixed(6) : '0.000000'}
                            </span>
                        )}
                    </div>

                    {isImage ? (
                        <div className="space-y-4">
                            <img
                                src={imageUrl}
                                alt="Generated AI artwork"
                                className="w-full rounded-2xl border-4 border-neo-ink object-cover"
                            />
                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-2xl border-4 border-neo-ink bg-neo-green px-4 py-2 text-sm font-black text-neo-ink shadow-[4px_4px_0_#111]"
                                >
                                    Download
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleMintNFT(imageUrl, messages[index - 1]?.content || 'AI image')}
                                    disabled={isMinting || isOptingIn}
                                    className="rounded-2xl border-4 border-neo-ink bg-neo-pink px-4 py-2 text-sm font-black text-neo-ink shadow-[4px_4px_0_#111] disabled:opacity-50"
                                >
                                    {isMinting || isOptingIn ? 'Minting...' : 'Mint as NFT'}
                                </button>
                            </div>
                            {mintedAssetId && (
                                <p className="rounded-xl border-2 border-neo-ink bg-neo-yellow px-3 py-2 text-xs font-black">
                                    Minted on Algorand Testnet: #{mintedAssetId}
                                </p>
                            )}
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm font-semibold leading-relaxed md:text-[15px]">
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
        <div className="min-h-screen bg-[#fff7df] text-neo-ink">
            <div className="neo-grid pointer-events-none fixed inset-0 opacity-70" />
            <div className="relative mx-auto flex min-h-screen w-full max-w-[1500px] gap-5 px-4 pb-6 pt-24 sm:px-6 lg:px-8">
                <div className="hidden w-[340px] shrink-0 xl:block">
                    <div className="sticky top-24 h-[calc(100vh-7.5rem)]">
                        <Sidebar />
                    </div>
                </div>

                {isSidebarOpen && (
                    <div className="fixed inset-0 z-50 xl:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-neo-ink/55 backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                            aria-label="Close workspace menu overlay"
                        />
                        <div className="absolute right-0 top-0 h-full w-[min(92vw,360px)] p-3">
                            <Sidebar isMobile />
                        </div>
                    </div>
                )}

                <main className="flex min-w-0 flex-1 flex-col gap-5">
                    <section className="neo-card bg-white p-4 sm:p-5 lg:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] border-4 border-neo-ink bg-neo-yellow text-4xl shadow-[6px_6px_0_#111]">
                                    {ICONS[service.id] || '✨'}
                                </div>
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <span className="section-tag !px-3 !py-1">SaaS Workspace</span>
                                        <span className="rounded-full border-4 border-neo-ink bg-neo-green px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
                                            {isPaid ? 'Session active' : 'Ready'}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{service.name}</h1>
                                    <p className="mt-2 max-w-2xl text-sm font-bold text-neo-ink/65 sm:text-base">
                                        {service.description || 'Launch a focused AI session with live balance tracking, model controls, and pay-per-use history.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="btn-secondary !px-5 !py-3 xl:hidden"
                            >
                                Open controls
                            </button>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[1.5rem] border-4 border-neo-ink bg-neo-yellow p-4 shadow-[7px_7px_0_#111]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Prepay wallet</p>
                            <p className="mt-2 text-3xl font-black">{formatMicroAlgo(balance)}</p>
                            <p className="text-sm font-black opacity-60">ALGO available</p>
                        </div>
                        <div className="rounded-[1.5rem] border-4 border-neo-ink bg-white p-4 shadow-[7px_7px_0_#111]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Current model</p>
                            <p className="mt-2 text-3xl font-black">{selectedModelCopy.name}</p>
                            <p className="text-sm font-black opacity-60">{selectedModelCopy.note}</p>
                        </div>
                        <div className="rounded-[1.5rem] border-4 border-neo-ink bg-neo-green p-4 shadow-[7px_7px_0_#111]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Tokens</p>
                            <p className="mt-2 text-3xl font-black">{Number(totalTokens || 0).toLocaleString()}</p>
                            <p className="text-sm font-black opacity-60">This session</p>
                        </div>
                        <div className="rounded-[1.5rem] border-4 border-neo-ink bg-neo-pink p-4 shadow-[7px_7px_0_#111]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Spend</p>
                            <p className="mt-2 text-3xl font-black">${Number(totalCost || 0).toFixed(4)}</p>
                            <p className="text-sm font-black opacity-60">USD estimate</p>
                        </div>
                    </section>

                    <section className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border-4 border-neo-ink bg-white shadow-[9px_9px_0_#111111]">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-neo-ink bg-[#c8b6ff] p-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">Prompt console</p>
                                    <h2 className="text-xl font-black">{conversationId ? 'Active session' : 'New session'}</h2>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border-4 border-neo-ink bg-white px-3 py-2 text-xs font-black">
                                    <span className={`h-3 w-3 rounded-full border-2 border-neo-ink ${isLoading ? 'animate-pulse bg-neo-pink' : 'bg-neo-green'}`} />
                                    {isLoading ? 'Processing' : 'Online'}
                                </div>
                            </div>

                            {payingStatus && (
                                <div className="m-4 rounded-2xl border-4 border-neo-ink bg-neo-yellow px-4 py-3 text-sm font-black shadow-[5px_5px_0_#111]">
                                    {payingStatus}
                                </div>
                            )}

                            <div className="flex-1 space-y-5 overflow-y-auto bg-[#fffdf5] p-4 sm:p-6">
                                {messages.length === 0 && !isLoading && (
                                    <div className="flex min-h-[360px] items-center justify-center">
                                        <div className="max-w-xl text-center">
                                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border-4 border-neo-ink bg-neo-yellow text-4xl shadow-[7px_7px_0_#111]">
                                                {ICONS[service.id] || '✨'}
                                            </div>
                                            <h3 className="text-3xl font-black">Build your next AI run</h3>
                                            <p className="mt-3 text-base font-bold text-neo-ink/65">
                                                Pick a model, drop a prompt, and track every token from the same responsive product workspace.
                                            </p>
                                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                                {QUICK_PROMPTS.map((item) => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => setPrompt(item)}
                                                        className="rounded-full border-4 border-neo-ink bg-white px-4 py-2 text-xs font-black shadow-[4px_4px_0_#111] transition-transform hover:-translate-y-1"
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, index) => (
                                    <MessageBubble key={`${msg.role}-${index}-${msg.content?.slice?.(0, 12) || index}`} msg={msg} index={index} />
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="rounded-[1.5rem] border-4 border-neo-ink bg-white p-4 shadow-[6px_6px_0_#111111]">
                                            <div className="flex items-center gap-3 text-sm font-black">
                                                <div className="h-5 w-5 animate-spin rounded-full border-4 border-neo-ink border-t-neo-blue" />
                                                {payingStatus || 'Generating response...'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {error && (
                                <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl border-4 border-neo-ink bg-neo-pink p-3 text-sm font-black text-neo-ink shadow-[5px_5px_0_#111]">
                                    <span>⚠️</span>
                                    <span className="flex-1">{error}</span>
                                    <button type="button" onClick={() => setError(null)} className="font-black">
                                        ✕
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendPrompt} className="border-t-4 border-neo-ink bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={messages.length === 0 ? 'Enter your prompt to start...' : 'Type a follow-up...'}
                                        className="input-dark min-h-[64px] flex-1 resize-none !rounded-[1.25rem]"
                                        disabled={isLoading}
                                        maxLength={2000}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !prompt.trim()}
                                        className="btn-primary shrink-0 disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
                                    >
                                        {isLoading ? 'Wait...' : messages.length === 0 ? 'Pay & Send' : 'Send ▶'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[2rem] border-4 border-neo-ink bg-white p-4 shadow-[8px_8px_0_#111111]">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Deposit</p>
                                <h3 className="mt-1 text-xl font-black">Top up workspace</h3>
                                <div className="mt-4 flex gap-2">
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={depositInput}
                                        onChange={(e) => setDepositInput(e.target.value)}
                                        className="input-dark !px-4 !py-2"
                                        aria-label="Deposit amount in ALGO"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleDeposit}
                                        disabled={isDepositing}
                                        className="rounded-2xl border-4 border-neo-ink bg-neo-green px-4 py-2 font-black shadow-[5px_5px_0_#111] disabled:opacity-50"
                                    >
                                        {isDepositing ? '...' : 'Add'}
                                    </button>
                                </div>
                                <p className="mt-3 text-xs font-bold text-neo-ink/60">Funds are verified on Algorand Testnet before the balance updates.</p>
                            </div>

                            <div className="rounded-[2rem] border-4 border-neo-ink bg-neo-yellow p-4 shadow-[8px_8px_0_#111111]">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Service pricing</p>
                                <h3 className="mt-1 text-2xl font-black">
                                    {service.price_algo ? `${service.price_algo} ALGO` : 'Pay per use'}
                                </h3>
                                <p className="mt-2 text-sm font-bold text-neo-ink/70">Contract #{paymentInfo?.app_id || 'syncing'} keeps each run metered.</p>
                            </div>

                            <div className="rounded-[2rem] border-4 border-neo-ink bg-white p-4 shadow-[8px_8px_0_#111111] xl:hidden">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-[0.16em]">Recent usage</h3>
                                    <button type="button" onClick={() => setIsSidebarOpen(true)} className="text-xs font-black text-neo-blue">
                                        View all
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {usageRows.slice(0, 3).map((row) => (
                                        <button
                                            key={`mobile-${row.id}`}
                                            type="button"
                                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                                            className="w-full rounded-2xl border-4 border-neo-ink bg-[#fff7df] p-3 text-left"
                                        >
                                            <div className="flex justify-between gap-2 text-sm font-black">
                                                <span className="truncate">{row.label}</span>
                                                <span>${Number(row.cost).toFixed(4)}</span>
                                            </div>
                                            <p className="text-xs font-bold text-neo-ink/60">{row.tokens} tokens · {row.date}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default WorkspacePage;
