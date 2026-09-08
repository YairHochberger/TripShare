export default function Card({ className = "", children }) {
  return (
    <div className={`bg-surface border border-line rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}
