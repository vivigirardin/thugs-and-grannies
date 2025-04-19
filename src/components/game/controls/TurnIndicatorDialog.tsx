import React from "react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TurnStepGuide from "./TurnStepGuide";

interface TurnIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDiceRolling: boolean;
  onRollDice: () => void;
}

const TurnIndicatorDialog: React.FC<TurnIndicatorDialogProps> = ({
  open,
  onOpenChange,
  isDiceRolling,
  onRollDice,
}) => {
  const { state } = useGame();
  const currentTeam = state.players[state.currentPlayer]?.team;

  const getTeamColor = (team: string) => {
    switch (team) {
      case "gang":
        return "bg-game-gang text-white";
      case "mafia":
        return "bg-game-mafia text-white";
      case "politicians":
        return "bg-game-politicians text-white";
      case "cartel":
        return "bg-game-cartel text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const determineTurnStep = () => {
    if (state.diceValue === 0) return 1;
    if (!state.cards.justDrawn && state.cards.playerHands[currentTeam || ""]?.length === 0) return 2;
    return 3;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center capitalize">
            {currentTeam}'s Turn
          </DialogTitle>
          <DialogDescription className="text-center">
            First roll the dice, then draw/use a card, finally move your meeple
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`p-4 rounded-full ${getTeamColor(currentTeam || "")}`}>
            <div className={`${isDiceRolling ? 'animate-dice-roll' : ''}`}>
              {/* Dice display handled by DiceControl */}
            </div>
          </div>
          
          {state.diceValue === 0 ? (
            <Button 
              onClick={() => {
                onRollDice();
                onOpenChange(false);
              }}
              className="w-32"
            >
              Roll Dice
            </Button>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-lg font-medium">You rolled a {state.diceValue}!</p>
              <p className="text-sm text-gray-600 mb-2">Next, draw a card or use one from your hand.</p>
            </div>
          )}

          <TurnStepGuide currentStep={determineTurnStep()} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TurnIndicatorDialog;
