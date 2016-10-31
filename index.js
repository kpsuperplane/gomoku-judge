var express = require('express');
var shortid = require('shortid');
var app = express();


/*  ==================================
                Bootstrap 
    ==================================  */

/* Stores all active games */
var games = {};

/* Basic Configuration */
var config = {
    size: 15,
    responseTime: 2000
}



/*  ==================================
            Helper Methods
    ==================================  */

/* Retrieves boards */
function getBoard(key){
    if(!(key in games)){ //gen new board if doesn't exist
        var matrix = [];
        for(var i=0; i<config.size; i++) {
            matrix[i] = new Array(config.size).fill(0);
        }
        games[key] = {
            timeout: null,
            registered: 0,
            currentPlayer: 1,
            token: null,
            playerIds: {},
            board: matrix,
            winner: null
        }
    }
    return games[key];
}

/* Returns JSON object of board */
function serializeBoard(key, player){
    var board = getBoard(key);

    if(winner != null){ //check if the dude won
        var hasWon = board.playerIds[player] == board.winner;
        deleteGame(key);
        return {status: hasWon?"winner":"loser"};
    }

    return {status: "success", key: key, token: board.token, player: player, board: board.board};
}

/* Continuously waits until it's `player`'s turn */
function wait(key, player, res){
    var board = getBoard(key, player);
    if(board.currentPlayer == player){
        board.timeout = setTimeout(changePlayerIff.bind(this, board, player), config.responseTime); //2 seconds to respond
        board.token = shortid.generate();
        res.send(serializeBoard(key, player));
    } 
    else setTimeout(wait.bind(this, key, player, res), 500);
}

/* Deletes a game... */
function deleteGame(key){
    if(key in games) delete games[key];
}

/* Changes the player for a board */
function changePlayer(board){
    board.currentPlayer = [0,2,1][board.currentPlayer];
}

/* Changes the player for a board if and only if current player is a player */
function changePlayerIff(board, player){
    if(board.currentPlayer == player){
        changePlayer(board);
        clearTimeout(board.timeout);
        board.timeout = null;
    } 
}

function floodCheck(board, x, y, deltaX, deltaY, count, player){
    const grid = board.board; //alias

    /* Special cases */
    if(count >= 5) return true; //the dude won

    if(grid[x][y] != player) return false; //the dude doesn't own this spot

    if(x < 0 || y < 0 || x >= config.size || y >= config.size) return false; //we are off the grid 

    return floodCheck(board, x + deltaX, x + deltaY, deltaX, deltaY, count + 1, player);
}



/*  ==================================
        Application API Routes
    ==================================  */

app.get('/register', function (req, res) {
    var key = req.query.key;
    var board = getBoard(key);

    /* Check if game is full */
    if(board.registered == 2){
        res.send({status: "error", message: "Game is full!"});
        return;
    }
    board.registered++;

    /* Generate Id and Register Player */
    var id = shortid.generate();
    board.playerIds[id] = board.registered;

    res.send(serializeBoard(key, id)); //return board

    setTimeout(deleteGame.bind(this, key), config.responseTime*15*15*1.5); //delete after reasonable time if not gone
});


app.get('/await', function(req, res){
    var board = getBoard(req.query.key, req.query.player);
    /* Check if valid player */
    if(!(req.query.player in board.playerIds)){ res.send({"status": "error", "message": "Invalid player."}); return}

    /* Wait */
    wait(req.query.key, board.playerIds[req.query.player], res);
});


app.get('/move', function(req, res){
    var board = getBoard(req.query.key);

    const x = req.query.x;
    const y= req.query.y;

    /* Check if valid move */
    if(!(req.query.player in board.playerIds) || board.currentPlayer != board.playerIds[req.query.player] || board.token != req.query.token){ res.send({"status": "error", "message": "Invalid player."}); return;}
    if(board.board[x][y] != 0){ res.send({status: "error", message: "Invalid move."}); return;}
    
    const p = (Number(board.playerIds[req.query.player]) == 1) ? 1 : 2; //player number

    /* Save the move */
    board.board[x][y] = p;

    /* Cleanup */
    changePlayer(board);
    clearTimeout(board.timeout);
    board.timeout = null;
    board.token = null;
    
    const b = board; //alias for sanity

    if(floodcheck(b,x,y,1,0,0,p)||floodcheck(b,x,y,1,1,0,p)||floodcheck(b,x,y,0,1,0,p)||floodcheck(b,x,y,-1,0,0,p)||floodcheck(b,x,y,-1,-1,0,p)||floodcheck(b,x,y,0,-1,0,p)||floodcheck(b,x,y,-1,1,0,p)||floodcheck(b,x,y,1,-1,0,p)){
        board.winner = p;
        res.send({status: "winner"});
        return;
    }

    res.send({status: "success"});
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log('Gomoku app listening on port '+port+'!');
});