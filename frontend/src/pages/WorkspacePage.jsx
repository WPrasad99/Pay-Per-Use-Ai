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
        <div className="flex min-h-full flex-col bg-white text-[#111]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Workspace</p>
                    <h1 className="text-base font-black md:text-xl">Control Room</h1>
                </div>
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

            <div className="mt-3 rounded-xl border-2 border-[#111] bg-yellow-200 p-3 shadow-[6px_6px_0px_#111] md:border-4">
                <p className="text-xs font-black">Balance</p>
                <p className="text-xl font-black md:text-2xl">{formatMicroAlgo(balance)} ALGO</p>
                <p className="mt-1 text-[11px] font-black opacity-60">{history.length} saved sessions</p>
            </div>

            <div className="mt-4 rounded-xl border-2 border-[#111] bg-white p-3 shadow-[4px_4px_0px_#111] md:border-4">
                <p className="font-black text-sm">Top up</p>
                <div className="mt-2 flex gap-2">
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={depositInput}
                        onChange={(e) => setDepositInput(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border-2 border-[#111] bg-white px-2 py-2 text-sm font-black outline-none md:border-4"
                        aria-label="Deposit amount in ALGO"
                    />
                    <button
                        type="button"
                        onClick={handleDeposit}
                        disabled={isDepositing}
                        className="rounded-lg border-2 border-[#111] bg-green-200 px-3 py-2 text-sm font-black shadow-[3px_3px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 md:border-4"
                    >
                        {isDepositing ? '...' : 'Add'}
                    </button>
                </div>
                <p className="mt-2 text-[11px] font-bold opacity-60">
                    Contract #{paymentInfo?.app_id || 'syncing'} · {service.price_algo ? `${service.price_algo} ALGO` : 'Pay per use'}
                </p>
            </div>

            <div className="mt-4">
                <p className="font-black text-sm">Models</p>
                {MODELS.map((model) => (
                    <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModel(model.id)}
                        className={`mt-2 w-full rounded-xl border-2 border-[#111] p-2 text-left text-sm font-black shadow-[4px_4px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none md:border-4 ${
                            selectedModel === model.id ? 'bg-green-200' : 'bg-white hover:-translate-y-0.5'
                        }`}
                    >
                        <span className="flex items-center justify-between gap-2">
                            <span>{model.name}</span>
                            <span className="text-[10px] uppercase opacity-60">{model.badge}</span>
                        </span>
                        <span className="block text-xs font-bold opacity-60">{model.note}</span>
                    </button>
                ))}
            </div>

            <div className="mt-5 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-sm">History</p>
                    <span className="rounded-full bg-[#111] px-2 py-1 text-[10px] font-black text-white">{usageRows.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                    {usageRows.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => row.conversationId && loadConversation(row.conversationId)}
                            className={`w-full rounded-xl border-2 border-[#111] p-2 text-left text-sm shadow-[4px_4px_0px_#111] transition-all hover:-translate-y-1 md:border-4 ${
                                row.conversationId === conversationId ? 'bg-green-200' : 'bg-white'
                            }`}
                        >
                            <span className="block truncate font-black">{row.label}</span>
                            <span className="mt-1 flex items-center justify-between gap-2 text-[11px] font-bold opacity-60">
                                <span>{row.tokens} tokens</span>
                                <span>${Number(row.cost).toFixed(4)}</span>
                            </span>
                        </button>
                    ))}
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
                            {isUser ? 'You' : selectedModelCopy.name}
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
                        <div className="min-w-0 text-sm md:text-base">
                            <span className="truncate">{service.name}</span> • {selectedModelCopy.name}
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="relative rounded-xl border-2 border-[#111] bg-green-200 px-4 py-2 text-sm font-black shadow-[4px_4px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none md:hidden"
                        >
                            Menu
                        </button>
                    </div>

                    {(payingStatus || error) && (
                        <div
                            className={`mx-2 mt-2 shrink-0 rounded-xl border-2 border-[#111] p-3 text-sm font-black shadow-[4px_4px_0px_#111] md:mx-4 md:border-4 ${
                                error ? 'bg-pink-200' : 'bg-yellow-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>{error ? '⚠️' : '⏳'}</span>
                                <span className="flex-1">{error || payingStatus}</span>
                                {error && (
                                    <button type="button" onClick={() => setError(null)} className="font-black" aria-label="Dismiss error">
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 overflow-y-auto p-2 pb-4 md:p-4">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex min-h-full items-center justify-center py-10">
                                <div className="max-w-xl rounded-xl border-2 border-[#111] bg-white p-5 text-center shadow-[6px_6px_0px_#111] md:border-4">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#111] bg-yellow-200 text-4xl shadow-[4px_4px_0px_#111] md:border-4">
                                        {ICONS[service.id] || '✨'}
                                    </div>
                                    <h2 className="text-2xl font-black md:text-3xl">Build your next AI run</h2>
                                    <p className="mt-2 text-sm font-bold opacity-70 md:text-base">
                                        Pick a model, drop a prompt, and track every token from one responsive workspace.
                                    </p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        {QUICK_PROMPTS.map((item) => (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => setPrompt(item)}
                                                className="rounded-xl border-2 border-[#111] bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0px_#111] transition-all hover:-translate-y-1 md:border-4"
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
                                placeholder={messages.length === 0 ? 'Type prompt...' : 'Type a follow-up...'}
                                className="h-11 min-w-0 flex-1 resize-none rounded-lg border-2 border-[#111] bg-white px-3 py-2 text-sm outline-none md:h-12 md:border-4 md:text-base"
                                disabled={isLoading}
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !prompt.trim()}
                                className="h-11 whitespace-nowrap rounded-lg border-2 border-[#111] bg-green-200 px-4 text-sm font-black shadow-[3px_3px_0px_#111] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:border-4 md:px-5 md:text-base"
                            >
                                {isLoading ? 'Wait...' : 'Send'}
                            </button>
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
