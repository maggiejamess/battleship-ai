# Bug Report: Battleship AI Game

### 1. Bug: AI Repeated Shots
- **Problem**: AI would sometimes fire at the same grid square more than once.
- **Cause**: No memory of previous moves.
- **Fix**: Added a `Set` to track previously fired positions and prevent repeats.

---

### 2. Bug: Ships Could Overlap on Placement
- **Problem**: Player could place ships on top of each other.
- **Fix**: Implemented check in placement logic to ensure no overlapping coordinates.

---

### 3. Bug: Game Would Not End on Win/Loss
- **Problem**: Game logic didn’t detect when all ships were sunk.
- **Fix**: Added function to check remaining ships and end game when zero remain.

---

### 4. Bug: No Visual Cue for Sunk Ships
- **Problem**: Player couldn’t tell when a ship was fully sunk.
- **Fix**: Added logic to track sunk ships and apply full-ship coloring.

---

### 5. Bug: No Restart Button
- **Problem**: After game over, user had to refresh the page.
- **Fix (in progress)**: Plan to add a "Play Again" button to reset game state.

---

### 6. Bug: Unlimited Ship Placement per Type 
- **Problem**: Before starting the game, the player could place multiple ships of the same type (e.g., more than one Carrier), which goes against Battleship rules. There was no visual feedback to show which ships had already been placed, and no way to reset an individual ship.  
- **Fix**: Limited ship placement to one of each type. Once placed, the ship name is shadowed to indicate it’s used. Additional placements of that ship are blocked unless the user clicks the ship name again to reset and reposition it.

---

### 7. Bug: Misleading Error Message During Ship Placement  
- **Problem**: When trying to place a ship adjacent to another ship, the game displayed the error message:  
*"Cells must form a straight line with no gaps!"*  
This was misleading because the placement failed due to proximity, not alignment or gaps. The message didn’t make it clear that ships cannot be placed adjacent to one another.
- **Fix**:  
The error message was updated to clarify all reasons for invalid placement. The new message now reads:  
*"Invalid placement! Cells must form a straight line with no gaps and cannot be adjacent to other ships."*  
No changes were made to the validation logic—just the displayed message for better user understanding.


### Additional Bugs Found During Implementation

- **Detailed ship visuals not showing during placement:**  
  Ships weren’t rendering due to a condition blocking them. Fixed by removing that condition.

- **Undo button not working properly:**  
  The undo logic prevented going back to an empty state (`historyIndex <= 0`). Changed to allow undoing all the way back (`historyIndex < 0`).

---

### Issues Requested and Fixed During Development

- Manual cell-by-cell ship placement instead of auto-placement after first click  
- Ships needed to be visible during gameplay  
- Added color coding: yellow for hits, red shading for sunk ships  
- Added undo/redo functionality and manual ship selection for placement


add bug report file
