import React from "react";

interface PlayerProps {
  character: string;
}

const spriteMap: Record<string, string> = {
  robot: "/assets/characters/robot.png",
  girl: "/assets/characters/girl.png",
  boy: "/assets/characters/boy.png",
};

const Player: React.FC<PlayerProps> = ({ character }) => {
  return (
    <div
      role="img"
      aria-label={`Selected character: ${character}`}
      className="sprite player-run absolute bottom-16 left-6 sm:left-10 z-[5] pointer-events-none"
      style={{
        backgroundImage: `url(${spriteMap[character] ?? spriteMap.robot})`,
      }}
    />
  );
};

export default Player;
