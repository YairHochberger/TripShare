export default function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-ink text-canvas hover:bg-clay",
    secondary: "border border-line-bold text-ink hover:border-ink",
    quiet: "text-faint hover:text-ink",
  };

  return (
    <button
      className={`rounded-full px-5 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
        styles[variant] || styles.primary
      } ${className}`}
      {...props}
    />
  );
}
