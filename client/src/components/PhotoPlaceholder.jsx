// The design leaves room for trip photography. There's no upload feature
// yet, so this fills the space with a quiet terrain motif rather than a
// broken image or an empty grey box.
//
// Positioning is left entirely to the caller (`className`) - the SVG
// simply fills whatever box it's given.
export default function PhotoPlaceholder({ className = "" }) {
  return (
    <div className={`overflow-hidden bg-map ${className}`}>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="block w-full h-full"
        aria-hidden="true"
      >
        <circle cx="322" cy="66" r="26" fill="#E4EBE2" />
        <path d="M0 230 L90 150 L150 205 L235 105 L330 210 L400 165 L400 300 L0 300 Z" fill="#CBD6C9" />
        <path d="M0 262 L120 196 L210 250 L300 190 L400 245 L400 300 L0 300 Z" fill="#BCCABA" />
      </svg>
    </div>
  );
}
