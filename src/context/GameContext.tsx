import React, { createContext, useContext, useReducer } from "react";
import { BoardState, GameAction, Position, Team } from "@/types/game";
import { toast } from "@/hooks/use-toast";

// Initial board size
const BOARD_SIZE = 20;

// Initial game state
const initialState: BoardState = {
  cells: Array(BOARD_SIZE).fill(null).map((_, rowIndex) => 
    Array(BOARD_SIZE).fill(null).map((_, colIndex) => ({
      type: "path",
      position: { row: rowIndex, col: colIndex },
      occupied: false,
    }))
  ),
  players: [],
  police: [],
  grannies: [],
  exits: [
    { row: 0, col: 5 },
    { row: 5, col: 0 },
    { row: BOARD_SIZE - 1, col: 15 },
    { row: 15, col: BOARD_SIZE - 1 },
  ],
  jailedPlayers: [], // Initialize the jailedPlayers array
  landmarks: {
    city: [], // Will be populated during board generation
    library: [],
    school: [],
    townhall: [],
  },
  buildingEntrances: {}, // Will be populated during board generation
  currentPlayer: 0,
  activeMeeple: null,
  diceValue: 1,
  gameStatus: "setup",
  winner: null,
  turnCount: 0,
};

// Define landmark properties
const landmarks = [
  { type: "city", size: 4, position: { row: 0, col: 2 } }, // 4x4 city at top-left near exit
  { type: "library", size: 3, position: { row: 2, col: BOARD_SIZE - 4 } }, // 3x3 library at top-right
  { type: "school", size: 5, position: { row: BOARD_SIZE - 6, col: 2 } }, // 5x5 school at bottom-left
  { type: "townhall", size: 3, position: { row: BOARD_SIZE - 4, col: BOARD_SIZE - 4 } }, // 3x3 townhall at bottom-right
];

// Function to find suitable locations for building entrances
const findEntranceLocations = (buildingType: string, buildingPositions: Position[], cells: Cell[][]): Position[] => {
  // Find edges of the building that are adjacent to path cells
  const potentialEntrances: Position[] = [];
  
  buildingPositions.forEach(pos => {
    const { row, col } = pos;
    
    // Check adjacent cells (up, down, left, right)
    const adjacentPositions = [
      { row: row - 1, col }, // up
      { row: row + 1, col }, // down
      { row, col: col - 1 }, // left
      { row, col: col + 1 }, // right
    ];
    
    adjacentPositions.forEach(adjPos => {
      if (
        adjPos.row >= 0 && adjPos.row < BOARD_SIZE && 
        adjPos.col >= 0 && adjPos.col < BOARD_SIZE &&
        cells[adjPos.row][adjPos.col].type === "path" &&
        !cells[adjPos.row][adjPos.col].occupied
      ) {
        // This is a valid edge with a path cell next to it
        potentialEntrances.push(pos);
      }
    });
  });
  
  // Shuffle the potential entrances and take the first 2 (or fewer if not enough)
  const shuffled = [...potentialEntrances].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(2, shuffled.length));
};

// Generate initial board with exits, police, grannies, and landmarks
const generateInitialBoard = (teams: Team[]): BoardState => {
  const state = { ...initialState };
  state.cells = Array(BOARD_SIZE).fill(null).map((_, rowIndex) => 
    Array(BOARD_SIZE).fill(null).map((_, colIndex) => ({
      type: "path",
      position: { row: rowIndex, col: colIndex },
      occupied: false,
    }))
  );
  
  // Set landmarks and keep track of their positions
  const landmarkPositions: Record<string, Position[]> = {
    city: [],
    library: [],
    school: [],
    townhall: [],
  };
  
  landmarks.forEach(landmark => {
    const { type, size, position } = landmark;
    const positions: Position[] = [];
    
    // Place the landmark on the board
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const row = position.row + r;
        const col = position.col + c;
        
        // Make sure we don't go out of bounds
        if (row < BOARD_SIZE && col < BOARD_SIZE) {
          state.cells[row][col].type = type as any;
          positions.push({ row, col });
        }
      }
    }
    
    // Store the positions for this landmark type
    landmarkPositions[type] = positions;
  });
  
  state.landmarks = landmarkPositions as any;
  
  // Set exit cells (they should be around landmarks but accessible)
  state.exits.forEach(exit => {
    state.cells[exit.row][exit.col].type = "exit";
  });
  
  // Make sure creeps and politicians are included in teams
  let mergedTeams = [...teams];
  if (!teams.includes("creeps")) {
    mergedTeams.push("creeps");
  }
  if (!teams.includes("politicians")) {
    mergedTeams.push("politicians");
  }
  
  // Create players and place them randomly on the board
  const players = [];
  const availablePositions: Position[] = [];
  
  // Collect all available positions that are path cells
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (state.cells[row][col].type === "path") {
        availablePositions.push({ row, col });
      }
    }
  }
  
  // Shuffle the positions
  const shuffledPositions = [...availablePositions].sort(() => 0.5 - Math.random());
  
  // Function to get a random position and remove it from the available list
  const getRandomPosition = (): Position => {
    if (shuffledPositions.length === 0) {
      return { row: 10, col: 10 }; // Fallback position
    }
    return shuffledPositions.pop()!;
  };
  
  // Create 5 players for each team (creeps, politicians)
  const creepsTeam = mergedTeams.includes("creeps") ? "creeps" : null;
  const politiciansTeam = mergedTeams.includes("politicians") ? "politicians" : null;
  
  if (creepsTeam) {
    for (let i = 0; i < 5; i++) {
      players.push({
        id: `creeps-${i}`,
        team: creepsTeam as Team,
        position: getRandomPosition(),
        escaped: false,
        arrested: false,
      });
    }
  }
  
  if (politiciansTeam) {
    for (let i = 0; i < 5; i++) {
      players.push({
        id: `politicians-${i}`,
        team: politiciansTeam as Team,
        position: getRandomPosition(),
        escaped: false,
        arrested: false,
      });
    }
  }
  
  // Add any other selected teams
  mergedTeams.filter(team => team !== "creeps" && team !== "politicians").forEach((team, teamIndex) => {
    for (let i = 0; i < 5; i++) {
      players.push({
        id: `${team}-${i}`,
        team,
        position: getRandomPosition(),
        escaped: false,
        arrested: false,
      });
    }
  });
  
  // Mark cells as occupied by players
  players.forEach(player => {
    const { row, col } = player.position;
    state.cells[row][col].occupied = true;
    state.cells[row][col].occupiedBy = player.id;
  });
  
  state.players = players;
  
  // Add building entrances/exits
  const buildingEntrances: { [key: string]: Position[] } = {};
  
  // For each landmark, find suitable entrance locations
  Object.entries(state.landmarks).forEach(([type, positions]) => {
    const entrances = findEntranceLocations(type, positions, state.cells);
    
    if (entrances.length >= 2) {
      // Set up pairs of entrances
      state.cells[entrances[0].row][entrances[0].col].type = "entrance";
      state.cells[entrances[0].row][entrances[0].col].connectedTo = entrances[1];
      
      state.cells[entrances[1].row][entrances[1].col].type = "entrance";
      state.cells[entrances[1].row][entrances[1].col].connectedTo = entrances[0];
      
      buildingEntrances[type] = entrances;
    }
  });
  
  state.buildingEntrances = buildingEntrances;
  
  // Add initial police AFTER players are placed, making sure they don't overlap
  const police: Position[] = [];
  const emptyCells: Position[] = [];
  
  // Find all empty cells that are not occupied by players
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Skip cells that are used for landmarks, exits, entrances, or players
      const cell = state.cells[row][col];
      if (
        cell.type === "path" && 
        !cell.occupied &&
        !state.exits.some(exit => exit.row === row && exit.col === col)
      ) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  // Randomly select 5 cells for police
  for (let i = 0; i < 5; i++) {
    if (emptyCells.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    police.push(emptyCells[randomIndex]);
    
    // Remove the selected cell so we don't pick it again
    emptyCells.splice(randomIndex, 1);
  }
  
  // Set police on the board
  police.forEach(pos => {
    state.cells[pos.row][pos.col].type = "police";
  });
  state.police = police;
  
  // Add initial grannies (3 for larger board)
  const grannies: Position[] = [];
  for (let i = 0; i < 3; i++) {
    if (emptyCells.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    grannies.push(emptyCells[randomIndex]);
    
    // Remove the selected cell
    emptyCells.splice(randomIndex, 1);
  }
  
  grannies.forEach(pos => {
    state.cells[pos.row][pos.col].type = "granny";
  });
  state.grannies = grannies;
  
  state.gameStatus = "playing";
  state.turnCount = 0;
  state.activeMeeple = null;
  
  return state;
};

// Helper function to check if a police officer would catch a player
const checkForPlayerCapture = (state: BoardState, newPolicePositions: Position[]): BoardState => {
  const newState = { ...state };
  let playerCaptured = false;
  
  newState.players = state.players.map(player => {
    if (player.arrested || player.escaped) return player;
    
    const isOnPolice = newPolicePositions.some(
      pos => pos.row === player.position.row && pos.col === player.position.col
    ) || state.police.some(
      pos => pos.row === player.position.row && pos.col === player.position.col
    );
    
    if (isOnPolice) {
      playerCaptured = true;
      toast({
        title: "Player Caught!",
        description: `A ${player.team} player was caught by the police!`,
        variant: "destructive"
      });
      return { ...player, arrested: true };
    }
    return player;
  });
  
  if (playerCaptured) {
    // Update jailed players
    newState.jailedPlayers = newState.players.filter(p => p.arrested);
    
    // Clean up any newly arrested players from the board
    newState.players.forEach(player => {
      if (player.arrested && !state.players.find(p => p.id === player.id)?.arrested) {
        const { row, col } = player.position;
        newState.cells[row][col] = {
          ...newState.cells[row][col],
          occupied: false,
          occupiedBy: undefined
        };
      }
    });
  }
  
  return newState;
};

// Helper function to add new police officers to the board
const addNewPolice = (state: BoardState): BoardState => {
  const newState = { ...state };
  
  // Find a random empty cell that's not an exit or already occupied by players, police, or grannies
  const emptyCells: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = state.cells[row][col];
      if (cell.type === "path" && !cell.occupied) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length === 0) {
    return state; // No empty cells to add police
  }
  
  // Add 5 new police officers
  const newPolicePositions: Position[] = [];
  for (let i = 0; i < 5; i++) {
    if (emptyCells.length === 0) break;
    
    // Select a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const newPolicePos = emptyCells[randomIndex];
    
    newPolicePositions.push(newPolicePos);
    
    // Remove this cell from empty cells
    emptyCells.splice(randomIndex, 1);
  }
  
  // Add the new police
  newState.police = [...state.police, ...newPolicePositions];
  
  // Update the cell types
  newState.cells = [...state.cells];
  newPolicePositions.forEach(pos => {
    newState.cells[pos.row] = [...state.cells[pos.row]];
    newState.cells[pos.row][pos.col] = {
      ...state.cells[pos.row][pos.col],
      type: "police"
    };
  });
  
  // Check if any players are caught by the new police
  return checkForPlayerCapture(newState, newPolicePositions);
};

// Helper function to add new grannies to the board
const addNewGrannies = (state: BoardState): BoardState => {
  const newState = { ...state };
  
  // Find a random empty cell that's not an exit or already occupied
  const emptyCells: Position[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = state.cells[row][col];
      if (cell.type === "path" && !cell.occupied) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length === 0) {
    return state; // No empty cells to add grannies
  }
  
  // Add 3 new grannies
  const newGrannyPositions: Position[] = [];
  for (let i = 0; i < 3; i++) {
    if (emptyCells.length === 0) break;
    
    // Select a random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const newGrannyPos = emptyCells[randomIndex];
    
    newGrannyPositions.push(newGrannyPos);
    
    // Remove this cell from empty cells
    emptyCells.splice(randomIndex, 1);
  }
  
  // Add the new grannies
  newState.grannies = [...state.grannies, ...newGrannyPositions];
  
  // Update the cell types
  newState.cells = [...state.cells];
  newGrannyPositions.forEach(pos => {
    newState.cells[pos.row] = [...state.cells[pos.row]];
    newState.cells[pos.row][pos.col] = {
      ...state.cells[pos.row][pos.col],
      type: "granny"
    };
  });
  
  return newState;
};

// Helper function to move grannies
const moveGrannies = (state: BoardState): BoardState => {
  const newState = { ...state };
  const newCells = JSON.parse(JSON.stringify(state.cells)); // Deep copy
  const newGrannies: Position[] = [];
  
  // For each granny, try to move in a random direction
  state.grannies.forEach(granny => {
    // Get possible moves (up, down, left, right)
    const possibleMoves: Position[] = [
      { row: granny.row - 1, col: granny.col }, // up
      { row: granny.row + 1, col: granny.col }, // down
      { row: granny.row, col: granny.col - 1 }, // left
      { row: granny.row, col: granny.col + 1 }, // right
    ].filter(pos => 
      pos.row >= 0 && pos.row < BOARD_SIZE && 
      pos.col >= 0 && pos.col < BOARD_SIZE &&
      newCells[pos.row][pos.col].type === "path" &&
      !newCells[pos.row][pos.col].occupied
    );
    
    // If there are possible moves, select one randomly
    let newPos: Position;
    if (possibleMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      newPos = possibleMoves[randomIndex];
      
      // Update the old cell
      newCells[granny.row][granny.col] = {
        ...newCells[granny.row][granny.col],
        type: "path"
      };
      
      // Update the new cell
      newCells[newPos.row][newPos.col] = {
        ...newCells[newPos.row][newPos.col],
        type: "granny"
      };
    } else {
      // Granny can't move, keep the same position
      newPos = { ...granny };
    }
    
    newGrannies.push(newPos);
  });
  
  newState.grannies = newGrannies;
  newState.cells = newCells;
  
  return newState;
};

// Helper function to move police
const movePolice = (state: BoardState): BoardState => {
  const newState = { ...state };
  const newCells = JSON.parse(JSON.stringify(state.cells)); // Deep copy
  const newPolicePositions: Position[] = [];
  const playersCaught: Player[] = [];
  
  // For each police officer, try to move toward the nearest player
  state.police.forEach(police => {
    // Find closest player that isn't arrested or escaped
    let closestPlayer: Player | null = null;
    let minDistance = Infinity;
    
    state.players.forEach(player => {
      if (!player.arrested && !player.escaped) {
        const distance = Math.abs(player.position.row - police.row) + 
                         Math.abs(player.position.col - police.col);
        if (distance < minDistance) {
          minDistance = distance;
          closestPlayer = player;
        }
      }
    });
    
    let newPos = { ...police };
    
    if (closestPlayer) {
      // Move toward the closest player
      const possibleMoves: Position[] = [];
      
      // Try to move closer (horizontally or vertically)
      if (closestPlayer.position.row < police.row) {
        possibleMoves.push({ row: police.row - 1, col: police.col }); // up
      } else if (closestPlayer.position.row > police.row) {
        possibleMoves.push({ row: police.row + 1, col: police.col }); // down
      }
      
      if (closestPlayer.position.col < police.col) {
        possibleMoves.push({ row: police.row, col: police.col - 1 }); // left
      } else if (closestPlayer.position.col > police.col) {
        possibleMoves.push({ row: police.row, col: police.col + 1 }); // right
      }
      
      // Filter valid moves (within board, not on entrances, not on other police)
      const validMoves = possibleMoves.filter(pos => 
        pos.row >= 0 && pos.row < BOARD_SIZE && 
        pos.col >= 0 && pos.col < BOARD_SIZE &&
        newCells[pos.row][pos.col].type !== "entrance" &&
        !newState.police.some(p => p.row === pos.row && p.col === pos.col) &&
        !newPolicePositions.some(p => p.row === pos.row && p.col === pos.col)
      );
      
      if (validMoves.length > 0) {
        // Choose a random valid move
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        newPos = validMoves[randomIndex];
      }
    }
    
    // Check if the new position has a player
    const targetCell = newCells[newPos.row][newPos.col];
    if (targetCell.occupied) {
      const player = state.players.find(p => p.id === targetCell.occupiedBy);
      if (player && !player.arrested && !player.escaped) {
        // Player caught!
        playersCaught.push(player);
      }
    }
    
    // Update the old cell - clear police
    newCells[police.row][police.col] = {
      ...newCells[police.row][police.col],
      type: "path"
    };
    
    // Update the new cell - add police
    newCells[newPos.row][newPos.col] = {
      ...newCells[newPos.row][newPos.col],
      type: "police"
    };
    
    newPolicePositions.push(newPos);
  });
  
  // Handle caught players
  newState.players = state.players.map(player => {
    if (playersCaught.some(p => p.id === player.id)) {
      toast({
        title: "Player Caught!",
        description: `A ${player.team} player was caught by the police!`,
        variant: "destructive"
      });
      return { ...player, arrested: true };
    }
    return player;
  });
  
  // Update jailed players
  newState.jailedPlayers = newState.players.filter(p => p.arrested);
  
  // Clean up any newly arrested players from the board
  playersCaught.forEach(player => {
    const { row, col } = player.position;
    newCells[row][col] = {
      ...newCells[row][col],
      occupied: false,
      occupiedBy: undefined
    };
  });
  
  newState.police = newPolicePositions;
  newState.cells = newCells;
  
  return newState;
};

// Game reducer
const gameReducer = (state: BoardState, action: GameAction): BoardState => {
  switch (action.type) {
    case "ROLL_DICE":
      return {
        ...state,
        diceValue: Math.floor(Math.random() * 6) + 1,
      };
    
    case "SELECT_MEEPLE": {
      const selectedPlayer = state.players.find(player => player.id === action.playerId);
      
      // Make sure the player belongs to the current team
      if (!selectedPlayer || 
          selectedPlayer.team !== state.players[state.currentPlayer].team ||
          selectedPlayer.arrested || 
          selectedPlayer.escaped) {
        return state;
      }
      
      return {
        ...state,
        activeMeeple: action.playerId,
      };
    }
      
    case "MOVE_PLAYER": {
      // Now we use the activeMeeple instead of currentPlayer
      if (!state.activeMeeple) {
        return state; // No meeple selected
      }
      
      const selectedPlayerIndex = state.players.findIndex(p => p.id === state.activeMeeple);
      if (selectedPlayerIndex === -1) {
        return state; // Player not found
      }
      
      const selectedPlayer = state.players[selectedPlayerIndex];
      const newPosition = action.position;
      
      // Check if the move is valid
      const dx = Math.abs(newPosition.row - selectedPlayer.position.row);
      const dy = Math.abs(newPosition.col - selectedPlayer.position.col);
      const distance = dx + dy;
      
      // Handle entrance/exit cells specially
      const currentCell = state.cells[selectedPlayer.position.row][selectedPlayer.position.col];
      const targetCell = state.cells[newPosition.row][newPosition.col];
      
      let isEntranceMove = false;
      
      if (targetCell.type === "entrance" && targetCell.connectedTo) {
        // Using a building entrance/exit
        const connectedPosition = targetCell.connectedTo;
        const connectedCell = state.cells[connectedPosition.row][connectedPosition.col];
        
        // Check if the connected entrance is occupied
        if (connectedCell.occupied) {
          // Can't use entrance if the exit is occupied
          return state;
        }
        
        isEntranceMove = true;
      } else if (distance > state.diceValue) {
        // Invalid move - too far
        return state;
      }
      
      // Check if cell is occupied by another player
      if (targetCell.occupied) {
        // Can't move to an occupied cell
        return state;
      }
      
      // Check if the cell is of type police
      if (targetCell.type === "police") {
        // Player got arrested
        const newPlayers = [...state.players];
        newPlayers[selectedPlayerIndex] = {
          ...selectedPlayer,
          arrested: true,
        };
        
        // Update jailed players
        const newJailedPlayers = [...state.jailedPlayers, newPlayers[selectedPlayerIndex]];
        
        // Clear old cell
        const oldPos = selectedPlayer.position;
        const newCells = [...state.cells];
        newCells[oldPos.row][oldPos.col] = {
          ...newCells[oldPos.row][oldPos.col],
          occupied: false,
          occupiedBy: undefined,
        };
        
        toast({
          title: "Player Caught!",
          description: `Your ${selectedPlayer.team} player was caught by the police!`,
          variant: "destructive"
        });
        
        return {
          ...state,
          players: newPlayers,
          jailedPlayers: newJailedPlayers,
          cells: newCells,
          activeMeeple: null,
          diceValue: 0,
        };
      }
      
      // Check for exit
      const isExit = state.exits.some(
        pos => pos.row === newPosition.row && pos.col === newPosition.col
      );
      
      // Update player position
      const newPlayers = [...state.players];
      
      // Clear old cell
      const oldPos = selectedPlayer.position;
      const newCells = [...state.cells];
      newCells[oldPos.row][oldPos.col] = {
        ...newCells[oldPos.row][oldPos.col],
        occupied: false,
        occupiedBy: undefined,
      };
      
      if (isEntranceMove && targetCell.connectedTo) {
        // Special case: using an entrance/exit
        const connectedPos = targetCell.connectedTo;
        
        // Update player position to the connected entrance
        newPlayers[selectedPlayerIndex] = {
          ...selectedPlayer,
          position: connectedPos,
        };
        
        // Update the connected cell to be occupied
        newCells[connectedPos.row][connectedPos.col] = {
          ...newCells[connectedPos.row][connectedPos.col],
          occupied: true,
          occupiedBy: selectedPlayer.id,
        };
        
        // Show a toast message
        toast({
          title: "Shortcut Used!",
          description: `Your ${selectedPlayer.team} player took a building shortcut!`,
        });
      } else {
        // Regular move
        newPlayers[selectedPlayerIndex] = {
          ...selectedPlayer,
          position: newPosition,
          escaped: isExit,
        };
        
        // Update new cell (unless it's an exit)
        if (!isExit) {
          newCells[newPosition.row][newPosition.col] = {
            ...newCells[newPosition.row][newPosition.col],
            occupied: true,
            occupiedBy: selectedPlayer.id,
          };
        } else {
          // Show a toast for successful escape
          toast({
            title: "Player Escaped!",
            description: `Your ${selectedPlayer.team} player successfully escaped!`,
            variant: "success"
          });
        }
      }
      
      // Check if game is over (all players from a team escaped or arrested)
      const remainingTeams = new Set<Team>();
      for (const player of newPlayers) {
        if (!player.arrested && !player.escaped) {
          remainingTeams.add(player.team);
        }
      }
      
      const allPlayersFinished = remainingTeams.size === 0;
      
      // If game is over, determine the winning team
      let winner: Team | null = null;
      if (allPlayersFinished) {
        const escapedCounts: Record<Team, number> = {
          creeps: 0,
          italian: 0,
          politicians: 0,
          japanese: 0,
        };
        
        for (const player of newPlayers) {
          if (player.escaped) {
            escapedCounts[player.team]++;
          }
        }
        
        let maxEscaped = 0;
        Object.entries(escapedCounts).forEach(([team, count]) => {
          if (count > maxEscaped) {
            maxEscaped = count;
            winner = team as Team;
          }
        });
      }
      
      return {
        ...state,
        cells: newCells,
        players: newPlayers,
        activeMeeple: null,
        diceValue: 0, // Reset dice after move
        gameStatus: allPlayersFinished ? "ended" : "playing",
        winner,
      };
    }
      
    case "NEXT_TURN": {
      let nextPlayer = (state.currentPlayer + 1) % state.players.length;
      const currentTeam = state.players[state.currentPlayer].team;
      
      // Find the first player of a different team
      while (state.players[nextPlayer].team === currentTeam) {
        nextPlayer = (nextPlayer + 1) % state.players.length;
      }
      
      // Check if the team is completely eliminated or escaped
      let teamEliminated = true;
      const nextTeam = state.players[nextPlayer].team;
      for (const player of state.players) {
        if (player.team === nextTeam && !player.arrested && !player.escaped) {
          teamEliminated = false;
          break;
        }
      }
      
      // If team is eliminated, find the next team
      if (teamEliminated) {
        const startingPlayer = nextPlayer;
        do {
          nextPlayer = (nextPlayer + 1) % state.players.length;
          if (nextPlayer === startingPlayer) {
            // All teams are eliminated or escaped, game over
            return {
              ...state,
              gameStatus: "ended",
            };
          }
        } while (state.players.every(p => 
          p.team === state.players[nextPlayer].team && (p.arrested || p.escaped)
        ));
      }
      
      // Increment turn count if we've gone through all players
      const turnCount = nextPlayer <= state.currentPlayer ? state.turnCount + 1 : state.turnCount;
      
      // Add new police officers and have existing police move towards players
      let newState = {
        ...state,
        currentPlayer: nextPlayer,
        activeMeeple: null,
        diceValue: 0, // Reset dice value
        turnCount,
      };
      
      // Move existing police every turn (this is the key change for making cops catch thugs)
      newState = movePolice(newState);
      
      // Add new police officers every 3 turns
      if (turnCount % 3 === 0 && turnCount > 0) {
        newState = addNewPolice(newState);
      }
      
      // Add 3 new grannies every 5 turns
      if (turnCount % 5 === 0 && turnCount > 0) {
        newState = addNewGrannies(newState);
      }
      
      // Move existing grannies every 2nd turn
      if (turnCount % 2 === 0 && turnCount > 0) {
        newState = moveGrannies(newState);
      }
      
      return newState;
    }
      
    case "START_GAME":
      return generateInitialBoard(action.teams);
      
    case "RESET_GAME":
      return {
        ...initialState,
        cells: Array(BOARD_SIZE).fill(null).map((_, rowIndex) => 
          Array(BOARD_SIZE).fill(null).map((_, colIndex) => ({
            type: "path",
            position: { row: rowIndex, col: colIndex },
            occupied: false,
          }))
        ),
      };
      
    case "PLAYER_CAUGHT": {
      const { playerId } = action;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (playerIndex === -1) {
        return state;
      }
      
      const player = state.players[playerIndex];
      const newPlayers = [...state.players];
      newPlayers[playerIndex] = {
        ...player,
        arrested: true,
      };
      
      // Clear old cell
      const oldPos = player.position;
      const newCells = [...state.cells];
      newCells[oldPos.row][oldPos.col] = {
        ...newCells[oldPos.row][oldPos.col],
        occupied: false,
        occupiedBy: undefined,
      };
      
      // Update jailed players
      const newJailedPlayers = [...state.jailedPlayers, newPlayers[playerIndex]];
      
      toast({
        title: "Player Caught!",
        description: `A ${player.team} player was caught by the police!`,
        variant: "destructive"
      });
      
      return {
        ...state,
        players: newPlayers,
        jailedPlayers: newJailedPlayers,
        cells: newCells,
        activeMeeple: null,
      };
    }
      
    default:
      return state;
  }
};

// Create context
interface GameContextType {
  state: BoardState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
