import { motion } from "framer-motion";

const HexGrid = () => {
  const hexes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06]">
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {hexes.map((i) => {
          const col = i % 6;
          const row = Math.floor(i / 6);
          const x = col * 120 + (row % 2 === 0 ? 0 : 60) + 50;
          const y = row * 105 + 50;
          return (
            <motion.polygon
              key={i}
              points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
              transform={`translate(${x}, ${y}) scale(0.5)`}
              fill="none"
              stroke="hsl(187 80% 42%)"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default HexGrid;
