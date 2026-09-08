export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-surface border border-line-strong rounded-[10px] px-4 py-3.5 text-base text-ink outline-none focus:border-ink transition-colors ${className}`}
      {...props}
    />
  );
}
