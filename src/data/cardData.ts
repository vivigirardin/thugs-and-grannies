
import { Team, Card, CardType } from "@/types/game";

export const CARDS: Omit<Card, 'id' | 'used'>[] = [
  // General cards
  { 
    type: "smoke_bomb" as CardType, 
    name: "Smoke Bomb", 
    description: "Avoid detection this turn. Police can't catch you.", 
    flavor: "Now you see me… now you don't.",
    icon: "bomb"
  },
  { 
    type: "shortcut" as CardType, 
    name: "Shortcut", 
    description: "Move diagonally once this turn, even if normally not allowed.", 
    flavor: "Found a crack in the fence.",
    icon: "arrow-right"
  },
  { 
    type: "fake_pass" as CardType, 
    name: "Fake Pass", 
    description: "Pass through a granny square once this turn.", 
    flavor: "Nice old lady. Didn't even notice.",
    icon: "user-minus-2"
  },
  { 
    type: "switcheroo" as CardType, 
    name: "Switcheroo", 
    description: "Swap any two of your gang members on the board.", 
    flavor: "You take the left, I'll take the right.",
    icon: "switch-camera"
  },
  
  // Gang cards
  { 
    type: "dumpster_dive" as CardType, 
    name: "Dumpster Dive", 
    description: "Hide in place for a turn – police and grannies ignore you.", 
    flavor: "Not glamorous, but it works.",
    team: "gang" as Team,
    icon: "user-minus-2"
  },
  { 
    type: "shiv" as CardType, 
    name: "Shiv", 
    description: "Push an adjacent police officer back one space.", 
    flavor: "He'll think twice next time.",
    team: "gang" as Team,
    icon: "sword"
  },
  
  // Mafia cards
  { 
    type: "lookout" as CardType, 
    name: "Lookout", 
    description: "See where police will move next turn.", 
    flavor: "Eyes on the streets.",
    team: "mafia" as Team,
    icon: "eye"
  },
  { 
    type: "bribe" as CardType, 
    name: "Bribe", 
    description: "Delay police movement for one round.", 
    flavor: "Everyone's got a price.",
    team: "mafia" as Team,
    icon: "dollar-sign"
  },
  { 
    type: "getaway_car" as CardType, 
    name: "Getaway Car", 
    description: "Move two gang members, 1 space each.", 
    flavor: "Hop in!",
    team: "mafia" as Team,
    icon: "car"
  },
  { 
    type: "cover_story" as CardType, 
    name: "Cover Story", 
    description: "One gang member can move through 1 police square.", 
    flavor: "He's with me.",
    team: "mafia" as Team,
    icon: "user"
  },
  
  // Politicians cards
  { 
    type: "lobbyist" as CardType, 
    name: "Lobbyist", 
    description: "Police delay their expansion by one round.", 
    flavor: "We're postponing this due to a press conference.",
    team: "politicians" as Team,
    icon: "clipboard-list"
  },
  { 
    type: "public_statement" as CardType, 
    name: "Public Statement", 
    description: "Choose 1 opponent's gang member to skip their next turn.", 
    flavor: "That's a scandal waiting to happen.",
    team: "politicians" as Team,
    icon: "speaker-off"
  },
  { 
    type: "red_tape" as CardType, 
    name: "Red Tape", 
    description: "Police can't move more than 1 space this round.", 
    flavor: "We'll need a permit for that...",
    team: "politicians" as Team,
    icon: "file-warning"
  },
  
  // Cartel cards
  { 
    type: "shadow_step" as CardType, 
    name: "Shadow Step", 
    description: "Move through 1 granny square this turn.", 
    flavor: "No sound. No trace.",
    team: "cartel" as Team,
    icon: "notepad-text"
  },
  { 
    type: "meditation" as CardType, 
    name: "Meditation", 
    description: "Reroll your dice once this turn.", 
    flavor: "Still the mind. Try again.",
    team: "cartel" as Team,
    icon: "dice-5"
  },
  { 
    type: "honor_bound" as CardType, 
    name: "Honor Bound", 
    description: "If a gang member is caught, immediately move another one 3 spaces.", 
    flavor: "Their sacrifice won't be in vain.",
    team: "cartel" as Team,
    icon: "fist"
  },
].filter(card => card.type !== "distraction" as CardType);
