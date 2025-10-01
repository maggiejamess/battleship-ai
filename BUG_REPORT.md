# Bug Report: Battleship AI Game

### 1. Bug: AI Repeated Shots
- **Problem**: AI would sometimes fire at the same grid square more than once.
  - Had no memory of previous moves
- **Fix**: Devin added functionality to track previously fired positions and prevent repeats.

---

### 2. Bug: Ships Could Overlap on Placement
- **Problem**: Player could place ships on top of each other.
- **Fix**: Devin implemented check in placement logic to ensure no overlapping coordinates.

---

### 3. Bug: Game Would Not End on Win/Loss
- **Problem**: Game logic didn’t detect when all ships were sunk.
  - No win/loss conclusion
- **Fix**: Devin added function to check remaining ships and end game when zero remain to then indicate win/loss.

---

### 4. Bug: No Visual Cue for Hit or Sunk Ships
- **Problem**: Player couldn’t tell when a ship was fully sunk, or hit at all.
- **Fix**: Devin added logic to track hit vs sunk ships and apply full-ship coloring when sunk.

---

### 5. Bug: No Restart Button
- **Problem**: After game ended, user had to refresh the page to reset to play again.
- **Fix**: Plan to add a "Play Again" button to reset game state.

---

### 6. Bug: Unlimited Ship Placement per Type 
- **Problem**: Before starting the game, the player could place multiple ships of the same type (e.g., more than one Carrier)
  - There was no visual feedback to show which ships had already been placed, and no way to reset an individual ship.  
- **Fix**: Limited ship placement to one of each type. Once placed, the ship name is shadowed to indicate it’s used.
  - Additional placements of that ship are blocked unless the user clicks the ship name again to reset and reposition it.

---

### 7. Bug: Misleading Error Message During Ship Placement  
- **Problem**: When trying to place a ship adjacent to another ship, the game displayed the error message:  *"Cells must form a straight line with no gaps!"*  
  - Misleading because the placement failed due to proximity, not alignment or gaps. (Message didn’t make it clear that ships cannot be placed adjacent to one another)
- **Fix**:  Error message was updated. New message now reads:  *"Invalid placement! Cells must form a straight line with no gaps and cannot be adjacent to other ships."*  

---

### Additional Bugs Found During Implementation

- Detailed ship visuals not showing during placement:
  - Ships weren’t rendering due to a condition blocking them. Devin Fixed by removing that condition.
- Added undo/redo functionality and manual ship selection for placement

---

### Issues I Requested and Fixed During Development

- Manual cell-by-cell ship placement instead of auto-placement after first click  
- Ships needed to be visible during gameplay  
- Added color coding: yellow for hits, red shading for sunk ships  
  


