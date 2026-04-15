import { motion } from "framer-motion";
import ScanlineOverlay from "./ScanlineOverlay";

interface Props {
  onSelect: (character: string) => void;
}

const characters = [
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "girl", emoji: "👩", label: "Specialist" },
  { id: "boy", emoji: "👦", label: "Operator" },
];

const CharacterSelect = ({ onSelect }: Props) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 grid-lines">
      <ScanlineOverlay />
      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="rec-dot" />
          <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
            Operative Assignment
          </span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider neon-text mb-2 uppercase">
          Select Your Operative
        </h1>
        <p className="text-muted-foreground text-xs mb-8 max-w-lg font-mono">
          <span className="text-primary/40">&gt;</span> Choose a field character before mission deployment
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          {characters.map((character, i) => (
            <motion.button
              key={character.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(character.id)}
              className="game-btn clip-corners text-center group"
            >
              <div className="text-4xl mb-2">{character.emoji}</div>
              <p className="font-display text-sm uppercase tracking-[0.18em] text-foreground">
                {character.label}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
