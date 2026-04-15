import { useState } from "react";
import ProfileSelection from "@/components/ProfileSelection";
import CharacterSelect from "@/components/CharacterSelect";
import GameEngine from "@/components/GameEngine";

const Index = () => {
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  const handleRestart = () => {
    setSelectedProfile(null);
    setSelectedCharacter(null);
  };

  if (!selectedProfile) {
    return <ProfileSelection onSelect={setSelectedProfile} />;
  }

  if (!selectedCharacter) {
    return <CharacterSelect onSelect={setSelectedCharacter} />;
  }

  return (
    <GameEngine
      profile={selectedProfile}
      character={selectedCharacter}
      onRestart={handleRestart}
    />
  );
};

export default Index;
