export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <div className="flex-1">{children}</div>

      <footer className="border-t border-line px-8 py-8 mt-16">
        <div className="max-w-[1180px] mx-auto flex flex-wrap gap-4 justify-between items-center">
          <span className="font-display text-[19px]">TripShare</span>
          <span className="text-[13px] text-faint">
            Plan together, argue less, go.
          </span>
        </div>
      </footer>
    </div>
  );
}
