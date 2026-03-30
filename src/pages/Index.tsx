import { useState } from "react";
import ProfileSelection from "@/components/ProfileSelection";
import GameEngine from "@/components/GameEngine";

const Index = () => {
  const [profileType, setProfileType] = useState<string | null>(null);

  const handleRestart = () => setProfileType(null);

  if (!profileType) {
    return <ProfileSelection onSelect={setProfileType} />;
  }

  return <GameEngine profileType={profileType} onRestart={handleRestart} />;
};

export default Index;
