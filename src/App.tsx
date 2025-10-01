import { useState, useEffect } from 'react'
import { Anchor, Target, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import './App.css'

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
type Board = CellState[][]
type Coordinate = { row: number; col: number }

interface Ship {
  name: string
  size: number
  placed: boolean
  coordinates: Coordinate[]
}

const GRID_SIZE = 10
const SHIPS: Omit<Ship, 'placed' | 'coordinates'>[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
]

function App() {
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard())
  const [aiBoard, setAiBoard] = useState<Board>(createEmptyBoard())
  const [playerShips, setPlayerShips] = useState<Ship[]>(
    SHIPS.map(ship => ({ ...ship, placed: false, coordinates: [] }))
  )
  const [aiShips, setAiShips] = useState<Ship[]>([])
  const [currentShipIndex, setCurrentShipIndex] = useState(0)
  const [gamePhase, setGamePhase] = useState<'placement' | 'playing' | 'gameOver'>('placement')
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [message, setMessage] = useState(`Place your ${SHIPS[0].name} (${SHIPS[0].size} cells) - Click cells to select`)
  const [aiTargetQueue, setAiTargetQueue] = useState<Coordinate[]>([])
  const [lastAiHit, setLastAiHit] = useState<Coordinate | null>(null)
  const [selectedCells, setSelectedCells] = useState<Coordinate[]>([])
  const [placementHistory, setPlacementHistory] = useState<{ board: Board; ships: Ship[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    if (gamePhase === 'playing' && !isPlayerTurn) {
      const timer = setTimeout(aiTurn, 1000)
      return () => clearTimeout(timer)
    }
  }, [gamePhase, isPlayerTurn])

  function createEmptyBoard(): Board {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'))
  }

  function validateShipPlacement(coordinates: Coordinate[]): boolean {
    if (coordinates.length === 0) return false
    
    const allSameRow = coordinates.every(c => c.row === coordinates[0].row)
    const allSameCol = coordinates.every(c => c.col === coordinates[0].col)
    
    if (!allSameRow && !allSameCol) return false
    
    const sorted = [...coordinates].sort((a, b) => 
      allSameRow ? a.col - b.col : a.row - b.row
    )
    
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const distance = allSameRow ? curr.col - prev.col : curr.row - prev.row
      if (distance !== 1) return false
    }
    
    for (const coord of coordinates) {
      if (playerBoard[coord.row][coord.col] !== 'empty') return false
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const checkRow = coord.row + dr
          const checkCol = coord.col + dc
          if (checkRow >= 0 && checkRow < GRID_SIZE && checkCol >= 0 && checkCol < GRID_SIZE) {
            if (playerBoard[checkRow][checkCol] === 'ship') {
              const isPartOfCurrentShip = coordinates.some(c => c.row === checkRow && c.col === checkCol)
              if (!isPartOfCurrentShip) return false
            }
          }
        }
      }
    }
    
    return true
  }

  function placeShipOnBoard(coordinates: Coordinate[]): void {
    const newBoard = playerBoard.map(row => [...row])
    coordinates.forEach(({ row, col }) => {
      newBoard[row][col] = 'ship'
    })
    
    const ship = playerShips[currentShipIndex]
    ship.coordinates = coordinates
    ship.placed = true
    
    const newShips = [...playerShips]
    newShips[currentShipIndex] = ship
    
    const newHistory = placementHistory.slice(0, historyIndex + 1)
    newHistory.push({ board: newBoard, ships: newShips })
    setPlacementHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    setPlayerBoard(newBoard)
    setPlayerShips(newShips)
    setSelectedCells([])
    
    const allPlaced = newShips.every(s => s.placed)
    if (allPlaced) {
      setMessage('All ships placed! Starting game...')
      placeAiShips()
      setTimeout(() => {
        setGamePhase('playing')
        setMessage("Your turn! Fire at the enemy board.")
      }, 1500)
    } else {
      const nextUnplacedIndex = newShips.findIndex(s => !s.placed)
      if (nextUnplacedIndex !== -1) {
        setCurrentShipIndex(nextUnplacedIndex)
        const nextShip = newShips[nextUnplacedIndex]
        setMessage(`${ship.name} placed! Now place your ${nextShip.name} (${nextShip.size} cells) - Click cells to select`)
      }
    }
  }

  function clearSelection() {
    setSelectedCells([])
    if (currentShipIndex < playerShips.length) {
      const ship = SHIPS[currentShipIndex]
      setMessage(`Place your ${ship.name} (${ship.size} cells) - Click cells to select`)
    }
  }

  function undo() {
    if (historyIndex < 0) return
    
    const newIndex = historyIndex - 1
    const state = newIndex === -1 
      ? { board: createEmptyBoard(), ships: SHIPS.map(ship => ({ ...ship, placed: false, coordinates: [] })) }
      : placementHistory[newIndex]
    
    setPlayerBoard(state.board)
    setPlayerShips(state.ships)
    setHistoryIndex(newIndex)
    setSelectedCells([])
    
    const placedCount = state.ships.filter(s => s.placed).length
    if (placedCount === 0) {
      setCurrentShipIndex(0)
      setMessage(`Undone. Place your ${SHIPS[0].name} (${SHIPS[0].size} cells) - Click cells to select`)
    } else {
      setMessage(`Undone. ${placedCount} ship${placedCount > 1 ? 's' : ''} placed.`)
    }
  }

  function redo() {
    if (historyIndex >= placementHistory.length - 1) return
    
    const newIndex = historyIndex + 1
    const state = placementHistory[newIndex]
    
    setPlayerBoard(state.board)
    setPlayerShips(state.ships)
    setHistoryIndex(newIndex)
    setSelectedCells([])
    
    const placedCount = state.ships.filter(s => s.placed).length
    setMessage(`Redone. ${placedCount} ship${placedCount > 1 ? 's' : ''} placed.`)
  }

  function selectShip(index: number) {
    if (playerShips[index].placed) {
      const ship = playerShips[index]
      const newBoard = playerBoard.map(row => [...row])
      
      ship.coordinates.forEach(({ row, col }) => {
        newBoard[row][col] = 'empty'
      })
      
      const newShips = [...playerShips]
      newShips[index] = { ...ship, placed: false, coordinates: [] }
      
      const newHistory = placementHistory.slice(0, historyIndex + 1)
      newHistory.push({ board: newBoard, ships: newShips })
      setPlacementHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      
      setPlayerBoard(newBoard)
      setPlayerShips(newShips)
      setCurrentShipIndex(index)
      setSelectedCells([])
      setMessage(`${ship.name} removed. Place your ${ship.name} (${ship.size} cells) - Click cells to select`)
      return
    }
    setCurrentShipIndex(index)
    setSelectedCells([])
    setMessage(`Place your ${SHIPS[index].name} (${SHIPS[index].size} cells) - Click cells to select`)
  }

  function handleCellClick(row: number, col: number) {
    if (gamePhase === 'placement') {
      if (currentShipIndex >= playerShips.length) return
      
      const ship = playerShips[currentShipIndex]
      
      if (ship.placed) {
        setMessage(`${ship.name} is already placed! Click the ship indicator to remove it first.`)
        return
      }
      
      const clickedCell = { row, col }
      
      const isAlreadySelected = selectedCells.some(c => c.row === row && c.col === col)
      
      if (isAlreadySelected) {
        setSelectedCells(selectedCells.filter(c => !(c.row === row && c.col === col)))
        setMessage(`Place your ${ship.name} (${ship.size} cells) - ${selectedCells.length - 1}/${ship.size} selected`)
        return
      }
      
      if (playerBoard[row][col] !== 'empty') {
        setMessage('Cannot place ship on occupied cell!')
        return
      }
      
      const newSelection = [...selectedCells, clickedCell]
      
      if (newSelection.length > ship.size) {
        setMessage(`Too many cells! ${ship.name} only needs ${ship.size} cells`)
        return
      }
      
      if (newSelection.length > 1) {
        if (!validateShipPlacement(newSelection)) {
          setMessage('Invalid placement! Cells must form a straight line with no gaps and cannot be adjacent to other ships.')
          return
        }
      }
      
      setSelectedCells(newSelection)
      
      if (newSelection.length === ship.size) {
        if (validateShipPlacement(newSelection)) {
          placeShipOnBoard(newSelection)
        } else {
          setMessage('Invalid ship placement!')
        }
      } else {
        setMessage(`Place your ${ship.name} (${ship.size} cells) - ${newSelection.length}/${ship.size} selected`)
      }
    } else if (gamePhase === 'playing' && isPlayerTurn) {
      if (aiBoard[row][col] === 'hit' || aiBoard[row][col] === 'miss' || aiBoard[row][col] === 'sunk') {
        setMessage('Already fired there!')
        return
      }
      
      const newBoard = aiBoard.map(r => [...r])
      if (newBoard[row][col] === 'ship') {
        newBoard[row][col] = 'hit'
        setMessage('Hit!')
        
        const hitShip = aiShips.find(ship => 
          ship.coordinates.some(coord => coord.row === row && coord.col === col)
        )
        
        if (hitShip && hitShip.coordinates.every(coord => newBoard[coord.row][coord.col] === 'hit')) {
          hitShip.coordinates.forEach(coord => {
            newBoard[coord.row][coord.col] = 'sunk'
          })
          setMessage(`You sunk the enemy ${hitShip.name}!`)
        }
        
        if (aiShips.every(ship => ship.coordinates.every(coord => newBoard[coord.row][coord.col] === 'sunk'))) {
          setMessage('You win! All enemy ships destroyed!')
          setGamePhase('gameOver')
        }
      } else {
        newBoard[row][col] = 'miss'
        setMessage('Miss!')
      }
      
      setAiBoard(newBoard)
      setIsPlayerTurn(false)
    }
  }

  function placeAiShips() {
    let currentBoard = createEmptyBoard()
    const ships: Ship[] = SHIPS.map(ship => ({ ...ship, placed: false, coordinates: [] }))
    
    ships.forEach(ship => {
      let placed = false
      while (!placed) {
        const horizontal = Math.random() > 0.5
        const row = Math.floor(Math.random() * GRID_SIZE)
        const col = Math.floor(Math.random() * GRID_SIZE)
        
        const coordinates: Coordinate[] = []
        let valid = true
        
        for (let i = 0; i < ship.size; i++) {
          const r = horizontal ? row : row + i
          const c = horizontal ? col + i : col
          
          if (r >= GRID_SIZE || c >= GRID_SIZE) {
            valid = false
            break
          }
          if (currentBoard[r][c] !== 'empty') {
            valid = false
            break
          }
          
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const checkRow = r + dr
              const checkCol = c + dc
              if (checkRow >= 0 && checkRow < GRID_SIZE && checkCol >= 0 && checkCol < GRID_SIZE) {
                if (currentBoard[checkRow][checkCol] === 'ship' && !(dr === 0 && dc === 0)) {
                  valid = false
                  break
                }
              }
            }
            if (!valid) break
          }
          if (!valid) break
          
          coordinates.push({ row: r, col: c })
        }
        
        if (valid && coordinates.length === ship.size) {
          coordinates.forEach(({ row, col }) => {
            currentBoard[row][col] = 'ship'
          })
          ship.coordinates = coordinates
          ship.placed = true
          placed = true
        }
      }
    })
    
    setAiShips(ships)
    setAiBoard(currentBoard)
  }

  function aiTurn() {
    let target: Coordinate

    if (aiTargetQueue.length > 0) {
      target = aiTargetQueue.shift()!
      setAiTargetQueue([...aiTargetQueue])
    } else if (lastAiHit) {
      const adjacents = [
        { row: lastAiHit.row - 1, col: lastAiHit.col },
        { row: lastAiHit.row + 1, col: lastAiHit.col },
        { row: lastAiHit.row, col: lastAiHit.col - 1 },
        { row: lastAiHit.row, col: lastAiHit.col + 1 },
      ].filter(coord => 
        coord.row >= 0 && coord.row < GRID_SIZE && 
        coord.col >= 0 && coord.col < GRID_SIZE &&
        playerBoard[coord.row][coord.col] !== 'hit' &&
        playerBoard[coord.row][coord.col] !== 'miss' &&
        playerBoard[coord.row][coord.col] !== 'sunk'
      )
      
      if (adjacents.length > 0) {
        target = adjacents[Math.floor(Math.random() * adjacents.length)]
      } else {
        setLastAiHit(null)
        target = getRandomTarget()
      }
    } else {
      target = getRandomTarget()
    }

    const newBoard = playerBoard.map(r => [...r])
    if (newBoard[target.row][target.col] === 'ship') {
      newBoard[target.row][target.col] = 'hit'
      setMessage(`AI hit your ship at ${String.fromCharCode(65 + target.row)}${target.col + 1}!`)
      setLastAiHit(target)
      
      const adjacents = [
        { row: target.row - 1, col: target.col },
        { row: target.row + 1, col: target.col },
        { row: target.row, col: target.col - 1 },
        { row: target.row, col: target.col + 1 },
      ].filter(coord => 
        coord.row >= 0 && coord.row < GRID_SIZE && 
        coord.col >= 0 && coord.col < GRID_SIZE &&
        newBoard[coord.row][coord.col] !== 'hit' &&
        newBoard[coord.row][coord.col] !== 'miss' &&
        newBoard[coord.row][coord.col] !== 'sunk'
      )
      
      setAiTargetQueue([...aiTargetQueue, ...adjacents])
      
      const hitShip = playerShips.find(ship => 
        ship.coordinates.some(coord => coord.row === target.row && coord.col === target.col)
      )
      
      if (hitShip && hitShip.coordinates.every(coord => newBoard[coord.row][coord.col] === 'hit')) {
        hitShip.coordinates.forEach(coord => {
          newBoard[coord.row][coord.col] = 'sunk'
        })
        setMessage(`AI sunk your ${hitShip.name}!`)
        setLastAiHit(null)
        setAiTargetQueue([])
      }
      
      if (playerShips.every(ship => ship.coordinates.every(coord => newBoard[coord.row][coord.col] === 'sunk'))) {
        setMessage('AI wins! All your ships are destroyed!')
        setGamePhase('gameOver')
      }
    } else {
      newBoard[target.row][target.col] = 'miss'
      setMessage(`AI missed at ${String.fromCharCode(65 + target.row)}${target.col + 1}`)
    }
    
    setPlayerBoard(newBoard)
    setIsPlayerTurn(true)
  }

  function getRandomTarget(): Coordinate {
    let row, col
    do {
      row = Math.floor(Math.random() * GRID_SIZE)
      col = Math.floor(Math.random() * GRID_SIZE)
    } while (
      playerBoard[row][col] === 'hit' || 
      playerBoard[row][col] === 'miss' ||
      playerBoard[row][col] === 'sunk'
    )
    return { row, col }
  }

  function resetGame() {
    setPlayerBoard(createEmptyBoard())
    setAiBoard(createEmptyBoard())
    setPlayerShips(SHIPS.map(ship => ({ ...ship, placed: false, coordinates: [] })))
    setAiShips([])
    setCurrentShipIndex(0)
    setGamePhase('placement')
    setIsPlayerTurn(true)
    setMessage(`Place your ${SHIPS[0].name} (${SHIPS[0].size} cells) - Click cells to select`)
    setAiTargetQueue([])
    setLastAiHit(null)
    setSelectedCells([])
    setPlacementHistory([])
    setHistoryIndex(-1)
  }

  function isInSelectedCells(row: number, col: number): boolean {
    return selectedCells.some(coord => coord.row === row && coord.col === col)
  }

  function getShipPartStyle(row: number, col: number): string {
    const ship = playerShips.find(s => 
      s.placed && s.coordinates.some(c => c.row === row && c.col === col)
    )
    
    if (!ship) return 'bg-gray-400'
    
    const coord = ship.coordinates.find(c => c.row === row && c.col === col)!
    
    const isHorizontal = ship.coordinates.every(c => c.row === ship.coordinates[0].row)
    
    const sortedCoords = [...ship.coordinates].sort((a, b) => 
      isHorizontal ? a.col - b.col : a.row - b.row
    )
    
    const coordPosition = sortedCoords.findIndex(c => c.row === coord.row && c.col === coord.col)
    const isBow = coordPosition === 0
    const isStern = coordPosition === sortedCoords.length - 1
    
    let style = 'bg-gradient-to-br from-gray-500 to-gray-600 border-2 border-gray-700'
    
    if (isBow && isHorizontal) style += ' rounded-l-lg'
    else if (isBow && !isHorizontal) style += ' rounded-t-lg'
    else if (isStern && isHorizontal) style += ' rounded-r-lg'
    else if (isStern && !isHorizontal) style += ' rounded-b-lg'
    
    if (ship.name === 'Carrier') style = style.replace('from-gray-500 to-gray-600', 'from-slate-600 to-slate-700')
    else if (ship.name === 'Battleship') style = style.replace('from-gray-500 to-gray-600', 'from-gray-600 to-gray-700')
    else if (ship.name === 'Cruiser') style = style.replace('from-gray-500 to-gray-600', 'from-zinc-500 to-zinc-600')
    else if (ship.name === 'Submarine') style = style.replace('from-gray-500 to-gray-600', 'from-stone-500 to-stone-600')
    
    return style
  }

  function getCellColor(cell: CellState, isPlayerBoard: boolean) {
    if (cell === 'empty') return 'bg-blue-100 hover:bg-blue-200'
    if (cell === 'ship') return isPlayerBoard ? '' : 'bg-blue-100 hover:bg-blue-200'
    if (cell === 'hit') return 'bg-yellow-400'
    if (cell === 'miss') return 'bg-blue-300'
    if (cell === 'sunk') return 'bg-red-600'
    return 'bg-blue-100'
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Anchor className="w-12 h-12" />
            Battleship
            <Anchor className="w-12 h-12" />
          </h1>
          <p className="text-xl text-blue-200">{message}</p>
        </div>

        {gamePhase === 'placement' && (
          <Card className="p-6 mb-6 bg-white bg-opacity-90">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-semibold mb-2">
                  Placing: {currentShipIndex < SHIPS.length ? SHIPS[currentShipIndex].name : 'All ships placed'}
                  {currentShipIndex < SHIPS.length && ` (${SHIPS[currentShipIndex].size} cells)`}
                </p>
                <p className="text-sm text-gray-600">
                  Ships remaining: {playerShips.filter(s => !s.placed).length}
                  {selectedCells.length > 0 && ` | Selected: ${selectedCells.length}/${SHIPS[currentShipIndex].size}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={undo}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={historyIndex < 0}
                >
                  <Undo className="w-4 h-4" />
                  Undo
                </Button>
                <Button 
                  onClick={redo}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={historyIndex >= placementHistory.length - 1}
                >
                  <Redo className="w-4 h-4" />
                  Redo
                </Button>
                {selectedCells.length > 0 && (
                  <Button 
                    onClick={clearSelection}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Anchor className="w-6 h-6" />
              Your Fleet
            </h2>
            <div className="bg-white bg-opacity-90 p-4 rounded-lg">
              <div className="grid grid-cols-11 gap-1">
                <div></div>
                {Array.from({ length: GRID_SIZE }, (_, i) => (
                  <div key={i} className="text-center font-bold text-sm">{i + 1}</div>
                ))}
                {playerBoard.map((row, rowIndex) => (
                  <>
                    <div key={`label-${rowIndex}`} className="flex items-center justify-center font-bold text-sm">
                      {String.fromCharCode(65 + rowIndex)}
                    </div>
                    {row.map((cell, colIndex) => {
                      const inSelected = isInSelectedCells(rowIndex, colIndex)
                      const cellColor = cell === 'ship' 
                        ? getShipPartStyle(rowIndex, colIndex) 
                        : getCellColor(cell, true)
                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`aspect-square ${
                            inSelected && gamePhase === 'placement' ? 'bg-orange-400 rounded border border-gray-300' : cellColor
                          } transition-colors ${
                            gamePhase === 'placement' ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                          disabled={gamePhase !== 'placement'}
                        />
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Enemy Waters
            </h2>
            <div className="bg-white bg-opacity-90 p-4 rounded-lg">
              <div className="grid grid-cols-11 gap-1">
                <div></div>
                {Array.from({ length: GRID_SIZE }, (_, i) => (
                  <div key={i} className="text-center font-bold text-sm">{i + 1}</div>
                ))}
                {aiBoard.map((row, rowIndex) => (
                  <>
                    <div key={`label-${rowIndex}`} className="flex items-center justify-center font-bold text-sm">
                      {String.fromCharCode(65 + rowIndex)}
                    </div>
                    {row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`aspect-square rounded ${getCellColor(cell, false)} border border-gray-300 transition-colors ${
                          gamePhase === 'playing' && isPlayerTurn ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        disabled={gamePhase !== 'playing' || !isPlayerTurn}
                      />
                    ))}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>

        {gamePhase === 'placement' && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-6 bg-white bg-opacity-90">
              <p className="text-lg mb-4">Click on a ship to select it, then place it on your board</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {playerShips.map((ship, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectShip(idx)}
                    className={`px-4 py-2 rounded transition-all ${
                      ship.placed ? 'bg-green-500 text-white opacity-60 hover:opacity-80 cursor-pointer' : idx === currentShipIndex ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                    }`}
                  >
                    {ship.name} ({ship.size})
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {gamePhase === 'gameOver' && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-6 bg-white bg-opacity-90">
              <h3 className="text-2xl font-bold mb-4">
                {message.includes('You win') ? '🎉 Victory!' : '💥 Defeat!'}
              </h3>
              <Button onClick={resetGame} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Play Again
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
