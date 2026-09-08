// Underline tabs, in the style of the redesign - no pills, no chrome,
// just a rule along the bottom and a marker under the active one.
export default function TripTabs({ tabs, active, onChange }) {
  return (
    <nav className="flex gap-[30px] mb-10 border-b border-line overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative py-[18px] px-0.5 text-[15px] whitespace-nowrap flex items-center gap-2 transition-colors ${
              isActive ? "text-ink" : "text-faint hover:text-ink"
            }`}
          >
            {tab.label}

            {tab.badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-[5px] rounded-full bg-clay text-surface text-[11px] grid place-items-center">
                {tab.badge}
              </span>
            )}

            {isActive && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-ink" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
