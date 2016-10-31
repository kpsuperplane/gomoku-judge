# GOMOKU JUDGE

This gomoku game takes place on a 15x15 board.

### API and Request Flow 

#### 1. Send a request to /register?key={insert_arbitrary_game_key}

This game key can be anything - just make sure both parties are using the same key. Both sides need to send a request to `/register` before the game can proceed. 

** Possible Responses: ** 
```json
{
    "status": "success",
    "key": "{my_arbitrary_game_key}",
    "token": null,
    "player": "{your_player_id [string]}",
    "playerNumber": "{your_player_number_as_on_the_board[1 or 0]}",
    "board": [
        [0,0,0, ....]
        ....
    ]
}
```
```json
{
    "status": "error",
    "message": "Game is full!"
}
```
#### 2. Send a request to /await?key={my_game_key}&player={my_player_id}

This request may or may not take a while depending on the other party. Essentially, this request will stay on hold and will only resolve when it is your turn to play. For example, in the beginning of the game, this endpoint will resolve instantly for one of the two players.  

Upon successful completion, the response will contain a `token` property which is a one-time move token to be used for the next request.

Also note, if the game is complete, this endpoint may return either "winner" or "loser"

**Possible Responses:**
```json
{
    "status": "success",
    "key": "{my_arbitrary_game_key}",
    "token": "{my_one_time_move_token}",
    "player": "{your_player_id [string]}",
    "playerNumber": "{your_player_number_as_on_the_board[1 or 0]}",
    "board": [
        [0,0,0, ....]
        ....
    ]
}
```
```json
{
    "status": "winner"
}
```
```json
{
    "status": "loser"
}
```
```json
{
    "status": "error",
    "message": "Invalid player."
}
```

#### 3. Send a request to /move?key={my_game_key}&player={my_player_id}&token={my_move_token}&x={my_x_coordinate}&y={my_y_coordinate}
This endpoint is to be called upon successful completion of await. It will return one of the possible responses:
```json
{
    "status": "success"
}
``` 
```json
{
    "status": "winner"
}
``` 
```json
{
    "status": "error", 
    "message": "Invalid move."
}
``` 
```json
{
    "status": "error", 
    "message": "Invalid player."
}
``` 
#### 4. Repeat!
If you have moved but not won, call `/await` again and the cycle repeats until someone has won!