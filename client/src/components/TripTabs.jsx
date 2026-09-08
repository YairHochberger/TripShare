// Switches which section of a trip you're looking at, the way a phone
// app swaps between screens instead of stacking everything on one page.
export default function TripTabs({ tabs, active, onChange }) {
  return (
    <div className="sticky top-4 z-20">
      <div className="bg-white rounded-2xl shadow ring-1 ring-black/5 p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex-1 min-w-[84px] flex flex-col items-center justify-center gap-0.5
                          rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            isActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>

              {tab.badge > 0 && (
                <span
                  className={`absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full
                              text-[10px] font-bold flex items-center justify-center ${
                                isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                              }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
