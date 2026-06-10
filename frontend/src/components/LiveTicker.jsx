const TICKER_ITEMS = [
  { value: "Pay Only For What You Use", label: "" },
  { value: "90% Revenue Goes To Creators", label: "" },
  { value: "Custom AI Agent Marketplace", label: "" },
  { value: "Blockchain-Powered Payments", label: "" },
  { value: "DID-Based Creator Identity", label: "" },
  { value: "No Monthly Subscriptions", label: "" },
];

export default function LiveTicker() {
  return (
    <section className="w-full overflow-hidden border-y border-foreground/[0.06] py-3 bg-background">
      <div className="ticker-track flex items-center whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <div
            key={index}
            className="mx-10 flex items-baseline gap-2"
          >
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground uppercase">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}