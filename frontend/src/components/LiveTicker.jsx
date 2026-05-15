const TICKER_ITEMS = [
  "⚡ Real-Time AI Streaming",
  "🔗 Smart Sessions Active",
  "💸 Pay-Per-Use Billing",
  "🚀 Multi-Model Intelligence",
  "💎 NFT Minting Enabled",
  "🧠 GPT-4o + Gemini + Llama",
];

export default function LiveTicker({ variant = "dark" }) {
  const isDark = variant === "dark";

  return (
    <section
      className={`w-full overflow-hidden border-y-2 border-black py-2 ${
        isDark ? "bg-black" : "bg-yellow-200"
      }`}
    >
      <div className="ticker-track flex whitespace-nowrap">

        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <div
            key={index}
            className={`mx-8 text-lg md:text-xl font-black uppercase ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            {item}
          </div>
        ))}

      </div>
    </section>
  );
}