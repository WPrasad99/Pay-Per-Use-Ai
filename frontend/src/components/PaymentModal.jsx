import React, { useState } from 'react';

const PaymentModal = ({ paymentInfo, onWalletSubmit, isLoading }) => {
    const [wallet, setWallet] = useState('');
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onWalletSubmit(wallet, prompt);
    };

    return (
        <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-neo-ink bg-neo-cream p-4 shadow-brutal-lg md:p-6 animate-[fadeIn_0.5s_ease]">
            
            {/* Background Grid */}
            <div className="neo-grid pointer-events-none absolute inset-0 opacity-50" />

            <div className="relative grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">

                {/* LEFT SIDE */}
                <section className="neo-card bg-white p-6 md:p-8 animate-[fadeUp_0.6s_ease]">

                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <span className="section-tag !bg-neo-green">
                                Step 1
                            </span>

                            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-neo-ink md:text-5xl">
                                Secure payment session
                            </h2>

                            <p className="mt-3 font-bold leading-7 text-neo-muted">
                                Scan, copy, and verify the exact Algorand payment
                                details before reserving your AI request.
                            </p>
                        </div>

                        <span className="rounded-full border-3 border-neo-ink bg-neo-yellow px-4 py-2 text-sm font-black shadow-brutal-sm">
                            On-chain
                        </span>
                    </div>

                    {/* QR */}
                    <div className="rounded-[1.35rem] border-4 border-neo-ink bg-neo-yellow p-4 shadow-brutal-sm">
                        <div className="mx-auto grid h-56 w-full max-w-56 place-items-center rounded-2xl border-4 border-neo-ink bg-white p-3">

                            {paymentInfo?.qr_code_base64 ? (
                                <img
                                    src={`data:image/png;base64,${paymentInfo.qr_code_base64}`}
                                    alt="QR Code"
                                    className="h-full w-full rounded-xl object-contain"
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center rounded-xl bg-neo-cream font-black text-neo-muted animate-pulse">
                                    Loading QR...
                                </div>
                            )}

                        </div>
                    </div>

                    {/* CONTRACT ADDRESS */}
                    <div className="mt-6">
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-neo-muted">
                            Smart Contract Address
                        </label>

                        <div className="flex overflow-hidden rounded-2xl border-4 border-neo-ink bg-white shadow-brutal-sm">

                            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-neo-ink md:text-sm">
                                {paymentInfo?.contract_address || 'Loading...'}
                            </code>

                            <button
                                type="button"
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        paymentInfo?.contract_address || ''
                                    )
                                }
                                className="border-l-4 border-neo-ink bg-neo-pink px-4 font-black text-neo-ink transition hover:bg-neo-green"
                            >
                                Copy
                            </button>

                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 rounded-2xl border-3 border-neo-ink bg-neo-cream p-4 shadow-brutal-sm">

                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-neo-muted">
                            Instructions
                        </label>

                        <ul className="space-y-3">

                            {paymentInfo?.instructions?.map((inst, i) => (
                                <li
                                    key={i}
                                    className="flex gap-3 text-sm font-bold leading-6 text-neo-ink"
                                >
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neo-ink text-xs text-white">
                                        {i + 1}
                                    </span>

                                    <span>{inst}</span>
                                </li>
                            ))}

                        </ul>

                    </div>

                </section>

                {/* RIGHT SIDE */}
                <section className="neo-card bg-neo-ink p-6 text-white md:p-8 animate-[fadeUp_0.8s_ease]">

                    <div className="mb-6">

                        <span className="section-tag !bg-white">
                            Step 2
                        </span>

                        <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-5xl">
                            Reserve your query
                        </h3>

                        <p className="mt-3 font-bold leading-7 text-gray-300">
                            Match your sending wallet to the on-chain payment and
                            add the prompt you want processed.
                        </p>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        {/* WALLET */}
                        <div>

                            <label className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-neo-green">
                                Your Algorand Wallet Address
                            </label>

                            <input
                                required
                                type="text"
                                maxLength={58}
                                minLength={58}
                                value={wallet}
                                onChange={(e) => setWallet(e.target.value)}
                                className="w-full rounded-2xl border-4 border-white bg-black px-4 py-4 font-mono text-sm text-white outline-none transition focus:scale-[1.01]"
                                placeholder="Address sending the payment..."
                            />

                            <p className="mt-3 text-xs font-bold text-gray-400">
                                Required to verify your transaction on-chain.
                            </p>

                        </div>

                        {/* PROMPT */}
                        <div>

                            <div className="mb-2 flex items-center justify-between gap-3">

                                <label className="block text-sm font-black uppercase tracking-[0.16em] text-neo-green">
                                    Your Prompt / Question
                                </label>

                                <span
                                    className={`rounded-full border-2 border-white px-3 py-1 text-xs font-black ${
                                        prompt.length > 1900
                                            ? 'bg-neo-pink text-neo-ink'
                                            : 'bg-white text-neo-ink'
                                    }`}
                                >
                                    {prompt.length} / 2000
                                </span>

                            </div>

                            <textarea
                                required
                                rows={7}
                                maxLength={2000}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full resize-none rounded-2xl border-4 border-white bg-black px-4 py-4 text-white outline-none transition focus:scale-[1.01]"
                                placeholder="Enter the code to review or essay topic..."
                            />

                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading || !wallet || !prompt}
                            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading
                                ? 'Creating Session...'
                                : 'Create Session & Start Payment Wait'}
                        </button>

                    </form>

                </section>

            </div>

        </div>
    );
};

export default PaymentModal;