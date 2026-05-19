import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorEarnings, getCreatorAnalytics, getCreatorProfile, confirmWithdrawal } from '../api/client';
import { peraWallet } from '../config/peraWallet';

export default function EarningsDashboard() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');
    const [profile, setProfile] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Withdrawal transaction modal states
    const [withdrawStatus, setWithdrawStatus] = useState(''); // '', 'loading', 'success', 'error'
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => { if (wallet) loadData(); }, [wallet]);

    const loadData = async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const [p, e, a] = await Promise.all([
                getCreatorProfile(wallet).catch(() => null),
                getCreatorEarnings(wallet).catch(() => ({ summary: {}, history: [] })),
                getCreatorAnalytics(wallet).catch(() => ({ analytics: {} })),
            ]);
            setProfile(p);
            setEarnings(e);
            setAnalytics(a);
        } catch (err) { console.error(err); }
        if (showSpinner) setLoading(false);
    };

    const handleWithdraw = async () => {
        const appId = earnings?.app_id || 0;
        const algodUrl = earnings?.algod_url || 'https://testnet-api.algonode.cloud';
        
        if (!appId || appId <= 0) {
            setWithdrawStatus('error');
            setErrorMessage('Algorand Smart Contract App ID not configured on backend.');
            return;
        }

        setWithdrawStatus('loading');
        setStatusMessage('Connecting to Algorand Node...');
        setErrorMessage('');

        try {
            const algosdk = (await import('algosdk')).default;
            const client = new algosdk.Algodv2('', algodUrl, '');
            
            setStatusMessage('Preparing on-chain withdrawal...');
            const params = await client.getTransactionParams().do();
            
            // Set 2000 microAlgo flat fee to cover inner payment transaction fee
            params.fee = 2000;
            params.flatFee = true;

            const withdrawMethod = new algosdk.ABIMethod({
                name: 'withdraw_earnings',
                args: [],
                returns: { type: 'uint64' },
            });

            const dummySigner = algosdk.makeBasicAccountTransactionSigner({ addr: wallet, sk: new Uint8Array(64) });
            const atc = new algosdk.AtomicTransactionComposer();
            const boxName = new Uint8Array([...new TextEncoder().encode('e_'), ...algosdk.decodeAddress(wallet).publicKey]);

            atc.addMethodCall({
                appID: appId,
                method: withdrawMethod,
                methodArgs: [],
                sender: wallet,
                suggestedParams: params,
                signer: dummySigner,
                boxes: [{ appIndex: appId, name: boxName }],
            });

            const group = atc.buildGroup().map(t => t.txn);

            setStatusMessage('Please approve the transaction in Pera Wallet...');
            
            let signed;
            try {
                // Ensure connected session first
                let accounts = [];
                try {
                    accounts = await peraWallet.reconnectSession();
                } catch (e) {}

                if (!accounts || accounts.length === 0) {
                    accounts = await peraWallet.connect();
                }
                
                if (!accounts || accounts.length === 0) {
                    throw new Error("Failed to connect to Pera Wallet.");
                }

                if (accounts[0] !== wallet) {
                    throw new Error(`Connected wallet address mismatch. Expected: ${wallet}`);
                }

                signed = await peraWallet.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Signing failed, trying reconnect...', signErr);
                // Handle clean fallback
                await peraWallet.disconnect().catch(() => {});
                const freshAccounts = await peraWallet.connect();
                if (freshAccounts[0] !== wallet) throw new Error('Wallet address mismatch after reconnect');
                signed = await peraWallet.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            }

            setStatusMessage('Broadcasting transaction to blockchain...');
            const { txId } = await client.sendRawTransaction(signed).do();

            setStatusMessage('Waiting for on-chain confirmation...');
            await algosdk.waitForConfirmation(client, txId, 8);

            setStatusMessage('Syncing payout ledger with database...');
            await confirmWithdrawal(wallet, txId);

            setWithdrawStatus('success');
            setStatusMessage('Withdrawal successful! Real-time balance updated.');
            loadData(false); // Reload analytics and earnings history silently
        } catch (err) {
            console.error('Withdrawal failed:', err);
            setWithdrawStatus('error');
            
            let msg = err.message || String(err);
            if (msg.includes("Mismatch") || msg.includes("different networks") || msg.includes("4100")) {
                msg = "Network mismatch. Please make sure both this dApp and your Pera Wallet are on Algorand Testnet (Developer Settings).";
            }
            setErrorMessage(msg);
        }
    };

    if (!wallet) return (
        <div className="min-h-screen bg-[#fff7df] flex items-center justify-center">
            <div className="rounded-2xl border-4 border-[#111] bg-white p-8 shadow-[6px_6px_0px_#111] text-center">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-xl font-black">Connect Wallet</h2>
            </div>
        </div>
    );

    const summary = earnings?.summary || {};
    const history = earnings?.history || [];
    const stats = analytics?.analytics || {};
    const totalEarned = (summary.total_earned_microalgo || 0) / 1_000_000;
    const totalWithdrawn = (summary.total_withdrawn_microalgo || 0) / 1_000_000;
    const available = (summary.available_microalgo || 0) / 1_000_000;

    const statCards = [
        { label: 'Available Balance', value: `${available.toFixed(4)} ALGO`, color: 'bg-green-200', icon: '💰' },
        { label: 'Lifetime Earned', value: `${totalEarned.toFixed(4)} ALGO`, color: 'bg-purple-200', icon: '📈' },
        { label: 'Total Withdrawn', value: `${totalWithdrawn.toFixed(4)} ALGO`, color: 'bg-cyan-200', icon: '🏦' },
        { label: 'Total Users', value: stats.unique_users || 0, color: 'bg-yellow-200', icon: '👥' },
        { label: 'Total Prompts', value: stats.total_uses || 0, color: 'bg-pink-200', icon: '💬' },
        { label: 'Tokens Served', value: (stats.total_tokens || 0).toLocaleString(), color: 'bg-orange-200', icon: '🔤' },
    ];

    return (
        <div className="min-h-screen bg-[#fff7df] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/dashboard')} className="text-sm font-bold opacity-60 hover:opacity-100 mb-2">← Back</button>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black">💰 Earnings Dashboard</h1>
                        {profile && <p className="font-bold opacity-60 mt-1">DID: {profile.did}</p>}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20"><div className="text-4xl animate-bounce mb-3">💰</div><p className="font-black">Loading...</p></div>
                ) : !profile ? (
                    <div className="rounded-2xl border-4 border-[#111] bg-white p-10 shadow-[6px_6px_0px_#111] text-center">
                        <div className="text-5xl mb-4">👤</div>
                        <h3 className="text-xl font-black mb-2">No Creator Profile</h3>
                        <p className="font-bold opacity-60 mb-4">Create a creator profile first to start earning</p>
                        <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-xl border-2 border-[#111] bg-purple-300 px-5 py-2.5 font-black shadow-[4px_4px_0px_#111] hover:-translate-y-0.5 transition-all">✨ Become a Creator</button>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {statCards.map((card, i) => (
                                <div key={card.label} className={`rounded-2xl border-4 border-[#111] ${card.color} p-5 shadow-[6px_6px_0px_#111] animate-soft-rise`} style={{ animationDelay: `${i * 80}ms` }}>
                                    <div className="text-2xl mb-2">{card.icon}</div>
                                    <p className="text-xs font-black uppercase tracking-wider opacity-60">{card.label}</p>
                                    <p className="text-xl font-black mt-1">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Withdrawal Banner */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111] mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black flex items-center gap-2">🏦 On-Chain Creator Payout</h3>
                                <p className="text-sm font-bold opacity-60 mt-1 max-w-xl">
                                    Withdraw your accrued AI agent usage fees. The payout is executed immediately from the smart contract to your connected wallet.
                                </p>
                            </div>
                            <button
                                onClick={handleWithdraw}
                                disabled={available <= 0}
                                className={`w-full md:w-auto rounded-xl border-2 border-[#111] px-6 py-3 font-black shadow-[4px_4px_0px_#111] transition-all ${
                                    available > 0
                                        ? 'bg-green-300 hover:-translate-y-0.5'
                                        : 'bg-gray-100 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {available > 0 ? `Withdraw ${available.toFixed(4)} ALGO` : 'No Earnings to Withdraw'}
                            </button>
                        </div>

                        {/* Earnings History */}
                        <div className="rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[6px_6px_0px_#111]">
                            <h2 className="text-lg font-black mb-4">📜 Earnings History</h2>
                            {history.length === 0 ? (
                                <p className="text-sm font-bold opacity-60 text-center py-8">No earnings yet. Publish agents and start earning!</p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {history.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-xl border-2 border-[#111] p-3 shadow-[2px_2px_0px_#111]">
                                            <div>
                                                <span className={`inline-block rounded-full border-2 border-[#111] px-2 py-0.5 text-[10px] font-black mr-2 ${item.tx_type === 'earning' ? 'bg-green-200' : 'bg-orange-200'}`}>
                                                    {item.tx_type === 'earning' ? '💰 Earned' : '🏦 Withdrawn'}
                                                </span>
                                                <span className="text-sm font-bold opacity-60">{item.agent_name || 'Agent'}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-sm">{(item.amount_microalgo / 1_000_000).toFixed(6)} ALGO</p>
                                                <p className="text-[10px] font-bold opacity-40">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Status / Loading Overlay Modal */}
            {withdrawStatus !== '' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="max-w-md w-full rounded-2xl border-4 border-[#111] bg-white p-6 shadow-[8px_8px_0px_#111]">
                        {withdrawStatus === 'loading' && (
                            <div className="text-center py-4">
                                <div className="text-4xl animate-spin mb-4">🔄</div>
                                <h3 className="text-lg font-black mb-2">Processing Withdrawal</h3>
                                <p className="text-sm font-bold text-gray-600 mb-4">{statusMessage}</p>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-purple-600 h-full animate-pulse" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                        )}

                        {withdrawStatus === 'success' && (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="text-lg font-black text-green-700 mb-2">Payout Success!</h3>
                                <p className="text-sm font-bold text-gray-600 mb-6">{statusMessage}</p>
                                <button
                                    onClick={() => setWithdrawStatus('')}
                                    className="rounded-xl border-2 border-[#111] bg-green-200 px-6 py-2.5 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 transition-all w-full"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {withdrawStatus === 'error' && (
                            <div className="text-center py-4">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="text-lg font-black text-red-700 mb-2">Transaction Failed</h3>
                                <p className="text-sm font-bold text-red-500 mb-6 max-h-40 overflow-y-auto bg-red-50 p-3 rounded-lg text-left break-words">
                                    {errorMessage}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleWithdraw}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-yellow-200 px-4 py-2.5 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 transition-all"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => setWithdrawStatus('')}
                                        className="flex-1 rounded-xl border-2 border-[#111] bg-white px-4 py-2.5 font-black shadow-[3px_3px_0px_#111] hover:-translate-y-0.5 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
