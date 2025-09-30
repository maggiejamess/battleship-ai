# 🐛 Bug Report – Battleship AI Game

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


add bug report file
