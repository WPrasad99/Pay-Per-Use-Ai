import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorEarnings, getCreatorAnalytics, getCreatorProfile, confirmWithdrawal } from '../api/client';
import { peraWallet } from '../config/peraWallet';

const StatCard = ({ label, value, icon }) => (
    <div className="border border-gray-200 rounded-2xl p-5 bg-white">
        <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-medium text-gray-500">{label}</p>
            <div className="w-8 h-8 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center">
                {icon}
            </div>
        </div>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
);

export default function EarningsDashboard() {
    const navigate = useNavigate();
    const wallet = localStorage.getItem('wallet_address') || sessionStorage.getItem('wallet_address');
    const [profile, setProfile] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const [withdrawStatus, setWithdrawStatus] = useState('');
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
                let accounts = [];
                try { accounts = await peraWallet.reconnectSession(); } catch (e) {}
                if (!accounts || accounts.length === 0) { accounts = await peraWallet.connect(); }
                if (!accounts || accounts.length === 0) { throw new Error("Failed to connect to Pera Wallet."); }
                if (accounts[0] !== wallet) { throw new Error(`Connected wallet address mismatch. Expected: ${wallet}`); }
                signed = await peraWallet.signTransaction([group.map(txn => ({ txn, signers: [wallet] }))]);
            } catch (signErr) {
                console.warn('Signing failed, trying reconnect...', signErr);
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
            loadData(false);
        } catch (err) {
            console.error('Withdrawal failed:', err);
            setWithdrawStatus('error');
            let msg = err.message || String(err);
            if (msg.includes("Mismatch") || msg.includes("different networks") || msg.includes("4100")) {
                msg = "Network mismatch. Please make sure both this dApp and your Pera Wallet are on Algorand Testnet.";
            }
            setErrorMessage(msg);
        }
    };

    if (!wallet) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="border border-gray-200 rounded-2xl p-10 text-center max-w-sm">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <h2 className="text-[15px] font-semibold text-gray-800 mb-1">Connect your wallet</h2>
                <p className="text-[13px] text-gray-500">Please connect your wallet to view earnings.</p>
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
        { 
            label: 'Available Balance', 
            value: `${available.toFixed(4)} ALGO`,
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
        },
        { 
            label: 'Lifetime Earned', 
            value: `${totalEarned.toFixed(4)} ALGO`,
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
        },
        { 
            label: 'Total Withdrawn', 
            value: `${totalWithdrawn.toFixed(4)} ALGO`,
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        { 
            label: 'Unique Users', 
            value: stats.unique_users || 0,
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        },
        { 
            label: 'Total Prompts', 
            value: stats.total_uses || 0,
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
        },
        { 
            label: 'Tokens Served', 
            value: (stats.total_tokens || 0).toLocaleString(),
            icon: <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
        },
    ];

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                        Back
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <h1 className="text-[15px] font-semibold text-gray-900">Earnings Dashboard</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Creator Earnings</h2>
                    {profile && <p className="text-[13px] text-gray-400">DID: {profile.did}</p>}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[14px] text-gray-500">Loading earnings…</p>
                        </div>
                    </div>
                ) : !profile ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-gray-200 rounded-2xl">
                        <svg className="w-10 h-10 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        <h3 className="text-[15px] font-semibold text-gray-800 mb-1">No Creator Profile</h3>
                        <p className="text-[13px] text-gray-500 mb-6">Create a creator profile first to start earning.</p>
                        <button onClick={() => navigate('/dashboard/create-agent')} className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Become a Creator
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {statCards.map((card) => (
                                <StatCard key={card.label} {...card} />
                            ))}
                        </div>

                        {/* Withdrawal Section */}
                        <div className="border border-gray-200 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
                                    On-Chain Creator Payout
                                </h3>
                                <p className="text-[13px] text-gray-500 max-w-md">
                                    Withdraw your accrued AI agent usage fees directly from the smart contract to your wallet.
                                </p>
                            </div>
                            <button
                                onClick={handleWithdraw}
                                disabled={available <= 0}
                                className={`shrink-0 rounded-lg border px-5 py-2.5 text-[13px] font-medium transition-colors ${
                                    available > 0
                                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {available > 0 ? `Withdraw ${available.toFixed(4)} ALGO` : 'No Earnings Yet'}
                            </button>
                        </div>

                        {/* History */}
                        <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <h2 className="text-[14px] font-semibold text-gray-800">Transaction History</h2>
                            </div>
                            {history.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-[13px] text-gray-400">No transactions yet. Publish agents and start earning!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                    {history.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.tx_type === 'earning' ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
                                                    {item.tx_type === 'earning' 
                                                        ? <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                        : <svg className="w-3.5 h-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-medium text-gray-800">{item.tx_type === 'earning' ? 'Earned' : 'Withdrawn'}</p>
                                                    <p className="text-[11px] text-gray-400">{item.agent_name || 'Agent'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[13px] font-semibold text-gray-900">{(item.amount_microalgo / 1_000_000).toFixed(6)} ALGO</p>
                                                <p className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Withdrawal Status Modal */}
            {withdrawStatus !== '' && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
                        {withdrawStatus === 'loading' && (
                            <div className="text-center py-4">
                                <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Processing Withdrawal</h3>
                                <p className="text-[13px] text-gray-500 mb-4">{statusMessage}</p>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-gray-800 h-full animate-pulse" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                        )}
                        {withdrawStatus === 'success' && (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </div>
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Payout Successful</h3>
                                <p className="text-[13px] text-gray-500 mb-5">{statusMessage}</p>
                                <button onClick={() => setWithdrawStatus('')} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        )}
                        {withdrawStatus === 'error' && (
                            <div className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                </div>
                                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Transaction Failed</h3>
                                <p className="text-[13px] text-red-500 mb-5 max-h-32 overflow-y-auto bg-red-50 p-3 rounded-lg text-left break-words">{errorMessage}</p>
                                <div className="flex gap-2">
                                    <button onClick={handleWithdraw} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Retry</button>
                                    <button onClick={() => setWithdrawStatus('')} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
