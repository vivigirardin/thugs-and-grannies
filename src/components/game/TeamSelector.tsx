import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useGame } from "@/context/GameContext";
import { Team } from "@/types/game";
import { CheckCircle } from "lucide-react";

const TeamSelector: React.FC = () => {
  const { dispatch } = useGame();
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(["gang", "politicians"]);
  
  const teams: { id: Team; name: string }[] = [
    { id: "gang", name: "Gang" },
    { id: "mafia", name: "Mafia" },
    { id: "politicians", name: "Politicians" },
    { id: "cartel", name: "Cartel" }
  ];
  
  const toggleTeam = (team: Team) => {
    setSelectedTeams(prev => 
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  };
  
  const handleStartGame = () => {
    if (selectedTeams.length === 0) {
      return;
    }
    dispatch({ type: "START_GAME", teams: selectedTeams });
  };
  
  const getTeamColorClass = (team: Team) => {
    switch (team) {
      case "gang":
        return "bg-game-gang text-white";
      case "mafia":
        return "bg-game-mafia text-white";
      case "politicians":
        return "bg-game-politicians text-white";
      case "cartel":
        return "bg-[#F2FCE2] text-black";
      default:
        return "bg-gray-500";
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Select Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {teams.map(team => (
              <div 
                key={team.id}
                className={`p-4 rounded-lg cursor-pointer relative ${
                  selectedTeams.includes(team.id) 
                    ? getTeamColorClass(team.id)
                    : "bg-muted"
                }`}
                onClick={() => toggleTeam(team.id)}
              >
                <h3 className="font-medium">{team.name}</h3>
                {selectedTeams.includes(team.id) && (
                  <CheckCircle className="absolute top-2 right-2 w-5 h-5" />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Select at least one team. Each team will have 5 players.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartGame}
            className="w-full"
            disabled={selectedTeams.length === 0}
          >
            Start Game
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeamSelector;
