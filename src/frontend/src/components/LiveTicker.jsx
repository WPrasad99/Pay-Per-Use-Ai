const TICKER_ITEMS = [
  { value: "Pay Only For What You Use", label: "" },
  { value: "90% Revenue Goes To Creators", label: "" },
  { value: "Custom AI Agent Marketplace", label: "" },
  { value: "Blockchain-Powered Payments", label: "" },
  { value: "DID-Based Creator Identity", label: "" },
  { value: "No Monthly Subscriptions", label: "" },
];

/* Map of words that get the accent color treatment */
const ACCENT_WORDS = new Set([
  "Pay",
  "Use",
  "90%",
  "Creators",
  "AI",
  "Agent",
  "Blockchain",
  "DID",
  "Identity",
  "No",
  "Subscriptions",
]);

/* Map of words that get extra-bold weight */
const BOLD_WORDS = new Set([
  "Pay",
  "Use",
  "90%",
  "Revenue",
  "Creators",
  "AI",
  "Agent",
  "Marketplace",
  "Blockchain",
  "Payments",
  "DID",
  "Identity",
  "No",
  "Subscriptions",
]);

function StyledText({ text }) {
  const words = text.split(" ");
  return (
    <span className="inline-flex items-baseline gap-[0.35em]">
      {words.map((word, i) => {
        const isAccent = ACCENT_WORDS.has(word);
        const isBold = BOLD_WORDS.has(word);
        return (
          <span
            key={i}
            className={[
              "transition-colors duration-300",
              isBold ? "font-extrabold" : "font-medium",
              isAccent ? "text-accent" : "text-foreground",
            ].join(" ")}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

function DiamondSeparator() {
  return (
    <span
      className="mx-8 md:mx-10 inline-flex items-center select-none flex-shrink-0"
      aria-hidden="true"
    >
      <span className="text-accent/40 text-[10px] leading-none">
        ◆
      </span>
    </span>
  );
}

export default function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="relative w-full overflow-hidden bg-background dot-grid">
      {/* ── Top animated divider ── */}
      <div className="divider-animated w-full" />

      {/* ── Ticker body ── */}
      <div
        className="relative py-4 md:py-5 group"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        {/* Hover pause visual overlay — dims content slightly */}
        <div className="pointer-events-none absolute inset-0 bg-background/0 group-hover:bg-background/[0.12] transition-all duration-500 z-10" />

        {/* Scrolling track */}
        <div className="ticker-track flex items-center whitespace-nowrap">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {/* Diamond separator before every item except the very first */}
              {index > 0 && <DiamondSeparator />}

              <div className="flex items-baseline gap-2 group-hover:opacity-80 transition-opacity duration-500">
                <span className="text-xl sm:text-2xl md:text-[1.7rem] tracking-tight uppercase leading-none">
                  <StyledText text={item.value} />
                </span>
              </div>
            </div>
          ))}
          {/* Trailing separator so the loop feels continuous */}
          <DiamondSeparator />
        </div>
      </div>

      {/* ── Bottom animated divider ── */}
      <div className="divider-animated w-full" />
    </section>
  );
}