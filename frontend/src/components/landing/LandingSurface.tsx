'use client'

/**
 * Shared outer shell for public marketing pages (home, /whats-new, …):
 * background, font, ticker + live-dot keyframes.
 */
export default function LandingSurface({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060e20',
        color: '#f1f5f9',
        fontFamily: 'var(--font-geist-sans)',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%       { opacity: 0.6; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .live-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>
      {children}
    </div>
  )
}
