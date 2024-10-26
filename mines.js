/*
    Things left to do:
    1. Local storage to store how rounds went (just the score) 
*/

const gameBoard = document.querySelector('.test-div'),
    squareBoard = document.querySelector('.square-invis-border'),
    timerDisplay = document.querySelector('.timer-display'),
    minesDisplay = document.querySelector('.mines-count'),
    startGameButton = document.querySelector('#start-game-btn'),
    resetGameButton = document.querySelector('#reset-game-btn'),
    pauseGameButton = document.querySelector('#pause-game-btn'),
    scoreDisplay = document.querySelector('.score-display')

let cells = [],
    cellsData = {},
    mines = [],
    flippedCells = 0,
    flaggedCells = [],
    playing = false,
    stoppingGame = false,
    paused = false

function placeDivs() 
{
    let divs = ''
    
    /* Used to place divs to represent tiles in-game. Each tile has tile_id where
    id is given by the number the tile is
    Each tile also calls the leftClick(id) function, passing in its own id
    */
    for (let i=0; i< 81; i++) 
    {
        divs += 
            `
                <div class='tile' id = 'tile_${i+1}'> </div>
            `
    }

    // The tiles are placed in the board
    squareBoard.innerHTML = divs
}

function addEvents()
{
    const allTiles = document.querySelectorAll('.tile')

    allTiles.forEach((tile) => {
        tile.addEventListener('click', function () {leftClick(Number(tile.id.split('_')[1]))})
        tile.addEventListener('contextmenu', function(event) {
            event.preventDefault()
            rightClick(Number(tile.id.split('_')[1]))
            })
        
    })
}

function leftClick(id)
{
    /* This prevents the left-clicking functionality from happening when the user
    is not playing, or the game is in the process of stopping */
    if (!playing) {
        if (!stoppingGame){
            endGame()
        }
        return
    } 

    console.log('LEFT-CLICK AT::', id)

    // First, this cell must not be flagged already
    if (cellsData[id]["flagged"]) { return }

    /* Second, this ensures that the cell left-click functionality 
    does not happen more than once*/
    if (!cellsData[id]["flipped"])
    {
        // First, we identify which tile it is by the id given
        const tile = document.querySelector(`#tile_${id}`)
        
        // Adds the 'left-clicked' class 
        tile.classList.add('left-clicked')

        // Adds the 'reversed-tile' class
        tile.classList.add('reversed-tile')  

        // Checks whether the cell clicked is a mine
        if (cellsData[id]["mine"])
            {
                //Here, the game will end!
                console.log("MINE CLICKED!")
                tile.classList.add('clicked-mine')
                tile.textContent = '💣'
                // End the game
                playing = false
                endGame()
            } else {
                /*
                Here, the cell will turn over and reveal the number of mines
                around it. It will also check the surrounding tiles -- check its 
                functionality
                */
               
               checkSurrounding(id)

               // Incase this happened to be the last cell to be flipped, end the game
               if ((flippedCells == 71)) { playing = false; endGame() }
            }
    }    
}

function rightClick (id) {
    // Flag, or unflag

    /* This prevents the right-clicking functionality from happening when the user
    is not playing, or the game is in the process of stopping */
    if (!playing) {
        if (!stoppingGame){
            endGame()
        }
        return
    } 

    console.log('RIGHT CLICK AT ::',id)
    if (!cellsData[id]["flipped"]) 
    {

        // Grab the tile
        tile = document.querySelector(`#tile_${id}`)

        //Toggle the 'flagged' classlist'
        tile.classList.toggle('flagged')

        // If the tile is currently flagged
        if (tile.classList.contains('flagged')) {
            flaggedCells.push(id)
            minesDisplay.textContent--
            cellsData[id]["flagged"] = true
        } else {
            flaggedCells.splice(flaggedCells.indexOf(id),1)
            minesDisplay.textContent++
            cellsData[id]["flagged"] = false
        }
    }
    
}

function flipCell (id) 
{
    //If this tile is not a mine
    if (!cellsData[id]["mine"]) 
    {

        // Identify which tile it is that is being flipped
        tile = document.querySelector(`#tile_${id}`)

        // If the cell was flagged, then, just unflag it for the user
        if (cellsData[id]["flagged"]) {
            tile.classList.toggle("flagged")
            cellsData[id]["flagged"] = false
        }

        //Reveal the number of mines near, but if 0, just display nothing
        tile.textContent = cellsData[id]["minesNear"] ? cellsData[id]["minesNear"] : ''

        // Add this tile to the flipped cells list
        if (!tile.classList.contains('checked')){
            flippedCells++
        }
        
        // If this happened to be the last cell to be flipped, just end the game
        if ((flippedCells == 71)) { playing = false; endGame() }

        //  Tell all other cells that this has already been flippped
        cellsData[id]["flipped"] = true

    } 
}

function checkSurrounding(id) 
{
    // Get the cell that is currently being checked
    const current_cell = cellsData[id]

    // Tell all other cells that it is currently in check
    current_cell["in-check"] = true

    /* If this cell happens to have a mine Near, we do not want it to
    check its surrounding cells
    */
    if (current_cell["minesNear"] !== 0)
    {
        // Flip the cell
        flipCell(id)

        // Tell surrounding cells that this cell has been checked fully
        current_cell["checked"] = true
        document.getElementById(`tile_${id}`).classList.add('checked')
        return
    } else {
        /*This is for the case that the current cell has no mines near
        What we need to do now is to check its surrounding cells first
        */

        // Get those surrounding cells
        const surroundingCells = getSurroundingCells(id)


        surroundingCells.forEach((cell) => {
            // For each cell, if it has not been checked, and it is not in check, check it
            if (!cellsData[cell]["checked"] && !cellsData[cell]["in-check"]) {
                checkSurrounding(cell)
            }
        })

        // After the surrounding cells have been checked, it will now also be checked
        flipCell(id)
        current_cell["checked"] = true
        document.getElementById(`tile_${id}`).classList.add('checked')
        return
    }
}

function getSurroundingCells(id) 
{
    let surroundingCells
    if (id % 9 === 0) {
        // Here, we are considering cells on the right border of the board
        surroundingCells = [id-9-1,id-9,id-1,id+9-1,id+9]
    } else if ( id % 9 === 1) {
        // Here, we are considering cells on the left border of the board
        surroundingCells = [id-9,id-9+1, id+1,id+9,id+9+1]
    } else {
        // General case: cells elsewhere, the implemented functionality works seamlessly
        surroundingCells = [id-9-1,id-9,id-9+1,id-1,id+1,id+9-1,id+9,id+9+1]
    }
    
    let cleanedSurroundingCells = []
    /*
    This is to ensure that the surrounding cells are actually there
    for example, cell 5 would technically have cell -4 as a surrounding cell
    but this makes no practical sense
    (e.g 1 has 3 cells, 45 has 9 -- differentiating btn these two scenarios)
    */
    surroundingCells.map((cell) => {
        if (cell > 0 && cell < 82){
            cleanedSurroundingCells.push(cell)
        }
    })

    return cleanedSurroundingCells
}

function generateMines()
{
    //Resets any previous cell data and mine data
    cells = []
    cellsData = {}

    /*Generate the cells' with default basic metadata. 
    Also stores the individual numbers in a list  for further operation*/
    for (let i = 0; i<81; i++)
    {   
        cells.push(i+1)
        cellsData[i+1] = {
            "mine":false,
            "minesNear":0,
            "flipped":false,
            "flagged":false,
            "checked":false,
            "in-check":false
        }
    }

    mines = []
    /*
    Generates 9 random mines, and stores them in an individual list
    These mines are removed from the larger list
    */
    for (let i = 0; i< 10; i++)
    {
        let randSlot = Math.floor(Math.random()*(81-i) + 1)
        mines.push(...cells.splice(randSlot-1, 1))
    }

    /*
    For each mine, its metadata records that it is a mine (mine = true)
    Then, the cells around the mine have their metadata changes such that
    minesNear ++
    */

    mines.forEach((mine) => {
        // Sets mine = true
        cellsData[mine]["mine"] = true

        // These are the surrounding cells of the mine
        let surroundingCells = getSurroundingCells(mine)

        // Actually changes the metadata for surrounding cells
        surroundingCells.forEach((cell) => {
                cellsData[cell]["minesNear"]++     
            })       
    })
}

function updateCells() 
{
    // After the placing of the mines has been figured:

    // Update the tiles that are mines to the 'mine' class
    mines.forEach((mine) => {
        document.querySelector(`#tile_${mine}`).classList.toggle('mine')
    })

    // Update the tiles that are near mines to their class, with the number of mines they have
    cells.forEach((cell) => {
        let mN = cellsData[cell]["minesNear"]
        if (mN !== 0) {
            document.querySelector(`#tile_${cell}`).classList.add(`mN-${mN}`)
        }
    })
}

function endGame()
{
    stoppingGame = true
    stopTimer()
    /* 
    This function is called when 
     1. All the cells have been flipped
     2. The user has clicked on a mine
    */

    // Scoring the game
    let numCorrectMines = 0;

    flaggedCells.forEach((cell) => {
        if (mines.includes(cell)) {
            numCorrectMines++
        }
    })

    const userScore = Math.round((numCorrectMines + flippedCells)/81 * 100,2)
    console.log('SCORE!')
    console.log(userScore)

    scoreDisplay.textContent = `${userScore}%, ${timer} seconds!`

    stoppingGame = false
    playing = false
}

// Timer Functions
let interval, timer
function startTimer()
{
    timer = 0
    interval = setInterval(() => {
        timerDisplay.textContent = timer
        timer++
    }, 1000)
}

function stopTimer()
{
    clearInterval(interval)
}
// RUN ONE ROUND OF THE GAME
function oneRound () 
{
    // Reset the flipped cells and the flagged cells
    flippedCells = 0
    flaggedCells = []

    // Reset the score display, timer display and mines display
    scoreDisplay.textContent = ''
    timerDisplay.textContent = 0
    minesDisplay.textContent = 10

    // Place the grids on the game board
    placeDivs()

    // Add the leftClick and rightClick event listeners to each tile
    addEvents()

    // Randomly determine which tiles are going to be mines
    generateMines()

    /* All mines are given class 'mine', and all other cells are 
    given a class based on the number of mines around them
    */
    updateCells()

    // Now that all is set up, start
    playing = true

    startTimer()

}


// FUNCTIONALITIES OF THE START GAME, STOP GAME AND PAUSE GAME BUTTONS
startGameButton.addEventListener('click', () => {
    if (playing) {return}
    
    oneRound()
})

resetGameButton.addEventListener('click', () => {
    if (!playing && !paused) {return}
    playing = false
    endGame()
})

pauseGameButton.addEventListener('click', () => {
    if (!playing) {return}
    if (!paused) {
        paused = true 
        pauseGameButton.textContent = "UNPAUSE"
    } else {
        paused = false 
        pauseGameButton.textContent = "PAUSE"
    }

    squareBoard.classList.toggle('noned-out')
})


    


