
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GameControls: React.FC = () => {
  const { state, dispatch } = useGame();
  const isMobile = useIsMobile();
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [showTurnDialog, setShowTurnDialog] = useState(false);
  const currentTeam = state.players[state.currentPlayer]?.team;

  React.useEffect(() => {
    if (state.gameStatus === "playing" && state.diceValue === 0) {
      setShowTurnDialog(true);
    }
  }, [state.currentPlayer, state.gameStatus]);
  
  const handleRollDice = () => {
    if (state.gameStatus !== "playing") return;
    setIsDiceRolling(true);
    
    // Small delay to show animation before updating state
    setTimeout(() => {
      dispatch({ type: "ROLL_DICE" });
      setIsDiceRolling(false);
    }, 500);
  };

  const handleEndTurn = () => {
    if (state.gameStatus !== "playing") return;
    dispatch({ type: "NEXT_TURN" });
    setShowTurnDialog(true);
  };

  const renderDice = () => {
    if (state.diceValue === 0) {
      return <Dice6 className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} opacity-50`} />;
    }

    const DiceIcons = [
      <Dice1 key={1} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
      <Dice2 key={2} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
      <Dice3 key={3} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
      <Dice4 key={4} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
      <Dice5 key={5} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
      <Dice6 key={6} className={`${isMobile ? "w-6 h-6" : "w-8 h-8"}`} />,
    ];
    
    return DiceIcons[state.diceValue - 1];
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case "creeps":
        return "bg-game-creeps text-white";
      case "italian":
        return "bg-game-italian text-white";
      case "politicians":
        return "bg-game-politicians text-white";
      case "japanese":
        return "bg-game-japanese text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className={`flex flex-col ${isMobile ? "items-start gap-2" : "items-center gap-4"} mb-4`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col items-center">
          <Button
            onClick={handleRollDice}
            disabled={state.gameStatus !== "playing" || state.diceValue > 0}
            className="relative"
            size={isMobile ? "sm" : "default"}
          >
            <div className={state.diceValue === 0 ? "" : "animate-dice-roll"}>
              {renderDice()}
            </div>
            <span className={`${isMobile ? "text-sm ml-1" : "ml-2"}`}>Roll Dice</span>
          </Button>
          
          {state.diceValue > 0 && (
            <div className={`${isMobile ? "text-xs" : "text-sm"} font-medium mt-2`}>
              You rolled a {state.diceValue}!
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleEndTurn}
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="flex items-center gap-1"
          disabled={state.gameStatus !== "playing"}
        >
          <SkipForward className={`${isMobile ? "w-4 h-4" : "w-5 h-5"}`} />
          <span className={`${isMobile ? "text-xs" : "text-sm"}`}>End Turn</span>
        </Button>
      </div>
      
      <Dialog open={showTurnDialog} onOpenChange={setShowTurnDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center capitalize">
              {currentTeam}'s Turn
            </DialogTitle>
            <DialogDescription className="text-center">
              Follow the turn order: Roll dice, Draw/Play card, Move meeple
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            <div className={`p-4 rounded-full ${getTeamColor(currentTeam || "")}`}>
              <div className={`${isDiceRolling ? 'animate-dice-roll' : ''}`}>
                {renderDice()}
              </div>
            </div>
            
            {state.diceValue === 0 ? (
              <Button 
                onClick={handleRollDice}
                className="w-32"
              >
                Roll Dice
              </Button>
            ) : (
              <div className="text-center">
                <p className="mb-2 text-lg font-medium">You rolled a {state.diceValue}!</p>
                <p className="text-sm text-gray-600 mb-2">Next, draw or play a card, then move a meeple.</p>
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 w-full mt-2">
              <h3 className="font-bold mb-1 text-amber-800 text-sm">Turn Order:</h3>
              <ol className="list-decimal text-sm text-amber-700 pl-5">
                <li className={state.diceValue ? "line-through opacity-60" : "font-bold"}>Roll the dice</li>
                <li className={state.cards.justDrawn ? "line-through opacity-60" : ""}>Draw a card OR play a card</li>
                <li className={state.diceValue === 0 ? "opacity-60" : ""}>Move a meeple</li>
                <li>End turn</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameControls;
