const ScanlineOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    {/* Scanlines */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(187 80% 42% / 0.08) 2px, hsl(187 80% 42% / 0.08) 4px)",
      }}
    />
    {/* Vignette */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 40%, hsl(222 47% 5% / 0.7) 100%)",
      }}
    />
    {/* Moving scan line */}
    <div className="scan-beam absolute left-0 right-0 h-[2px]" style={{
      background: 'linear-gradient(90deg, transparent, hsl(var(--neon-cyan) / 0.15), transparent)',
    }} />
    {/* Secondary scan line (slower, magenta) */}
    <div className="scan-beam absolute left-0 right-0 h-[1px]" style={{
      background: 'linear-gradient(90deg, transparent, hsl(var(--neon-magenta) / 0.08), transparent)',
      animationDelay: '2s',
      animationDuration: '6s',
    }} />
  </div>
);

export default ScanlineOverlay;
