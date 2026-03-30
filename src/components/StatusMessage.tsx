import { motion, AnimatePresence } from "framer-motion";

interface Props {
  message: string | null;
}

const StatusMessage = ({ message }: Props) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.4 }}
          className="relative hud-panel p-4 overflow-hidden"
          style={{
            borderColor: 'hsl(var(--neon-magenta) / 0.4)',
            boxShadow: '0 0 15px hsl(var(--neon-magenta) / 0.1), inset 0 0 15px hsl(var(--neon-magenta) / 0.03)',
          }}
        >
          <div className="corner-deco corner-deco-tl" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.7)' }} />
          <div className="corner-deco corner-deco-br" style={{ borderColor: 'hsl(var(--neon-magenta) / 0.7)' }} />

          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="rec-dot" />
              <span className="text-[9px] font-display uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--neon-magenta))' }}>
                SYS.RESPONSE
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              <span className="text-neon-magenta mr-1">&gt;</span>
              {message}
            </p>
          </div>

          {/* Animated shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/[0.03] to-transparent shimmer-slide" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusMessage;
