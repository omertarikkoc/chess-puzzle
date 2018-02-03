// Global Variables
chess = new Chess();
var newPGN = "";
var fenPosition;
var currentMove = 0;
var boardElement = $('#newBoard');
var PGNFile;
var gamesInPGN = [];
var gamesCountInPGN = 0;
var currentGameInPGN = 0;
var gamesLoadedFromPGN = false;
var puzzleCompletionStatus = "";
var puzzleCompletionStatusElement = $('#progress-bar-games');
var pgnVariantStartPosition;
var gamesWithVariants;

_get_file("../pgn/ai3.pgn", function (response) {
	PGNFile = response;
	loadBoard(PGNFile);
});

// Functions 
function _get_file(url, callback) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", url, true);
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			callback(xmlhttp.responseText);
		}
	}
	xmlhttp.send();
}

function loadBoard(response) {
	if (!gamesLoadedFromPGN) {
		var eventStrPosition = response.indexOf('[Event');
		while (eventStrPosition !== -1) {
			var sliceStartPosition = eventStrPosition;
			gamesCountInPGN++;
			eventStrPosition = response.indexOf('[Event', eventStrPosition + 1);
			var sliceEndPosition = eventStrPosition - 2;
			if (sliceEndPosition <= 0) {
				sliceEndPosition = PGNFile.length - 2;
			}
			console.log("Start: ", sliceStartPosition, "| End: ", sliceEndPosition);
			
			gamesInPGN.push(response.slice(sliceStartPosition, sliceEndPosition));
			

			
			
			pgnVariantStartPosition = response.slice(sliceStartPosition, sliceEndPosition).indexOf('(');
			if(pgnVariantStartPosition > 0) {
				console.log("There is a game with a variant", pgnVariantStartPosition);
				console.log(response.slice(sliceStartPosition, sliceEndPosition));
			}
			gamesLoadedFromPGN = true;
		}
		console.log("Total Games in The PGN: ", gamesCountInPGN);
	}

	newPGN = gamesInPGN[currentGameInPGN];
	newPGN = newPGN.split('\n');

	//_loadFromPGN(newPGN.join("\n"));
	if(!(chess.load_pgn(newPGN.join('\n')))){
		console.log("Game had error while loading: ", currentGameInPGN);
		currentGameInPGN++;
		loadBoard(response);
	}
	
	chess.load_pgn(newPGN.join('\n'));
	console.log("Game Number:",currentGameInPGN,chess.load_pgn(newPGN.join('\n')));




	gameHistory = chess.history({
		verbose: true
	});



	//Go back to the PGN start position
	for (i = 0; i < gameHistory.length; i++) {
		chess.undo();
	}

	fenStartingPosition = chess.fen();

	var chessBoardConfig = {
		position: fenStartingPosition,
		draggable: true,
		moveSpeed: 'slow',
		snapbackSpeed: 500,
		snapSpeed: 100,
		onDrop: onDrop,
	}

	// Show the progress of puzzle completion
	puzzleCompletionStatus = (currentGameInPGN + 1) + " / " + gamesCountInPGN;
	puzzleCompletionStatusElement.html(puzzleCompletionStatus);

	newBoard = ChessBoard('newBoard', chessBoardConfig);
	newBoard.position(fenStartingPosition);
}

function _loadFromPGN(pgnFile, callback) {
	chess.load_pgn(pgnFile);
	console.log("success:", chess.load_pgn(pgnFile));
}

function goToMove(ply) {
	if (ply > gameHistory.length - 1) ply = gameHistory.length - 1;
	chess.reset();
	for (var i = 0; i <= ply; i++) {
		chess.move(gameHistory[i].san);
	}
	currentPly = i - 1;
	newBoard.position(chess.fen());
}

// This function will be fired when the drop events occur
var onDrop = function (source, target) {
	console.log("source: ", source);
	console.log("Target:", target);
	var move = chess.move({
		from: source,
		to: target,
		promotion: 'q' // NOTE: always promote to a queen for example simplicity
	});

	// Only allow the legal moves
	if (move === null) {
		var wrongAudio = new Audio("audio/wrong.mp3");
		wrongAudio.play();
		console.log("NULL");
		return 'snapback';
	} else if (move.san == gameHistory[currentMove].san) {
		console.log("CORRECT");
		if (currentMove == gameHistory.length - 1) {
			currentGameInPGN++;
			// Play the sound
			var correctAudio = new Audio("audio/correct.mp3");
			correctAudio.play();
			setTimeout(function () {
				// Show alert (https://lipis.github.io/bootstrap-sweetalert/)
				swal({
					title: "Tebrikler!",
					text: "Cozumun Dogru",
					type: "success",
				}, function (value) {
					loadBoard(PGNFile);
					reRenderChessBoard();
					changeProgressBar("progress-bar-games",currentGameInPGN,0,gamesCountInPGN);
					console.log(value);
				})
				// swal("Tebrikler!", "Cozumun Dogru", "success").then(function(value){
				// 	console.log(value);
				// });
			}, 1300);
			return;
		}
		currentMove++;
		chess.move(gameHistory[currentMove].san);
		var boardMove = "";
		boardMove = gameHistory[currentMove].from + "-" + gameHistory[currentMove].to;
		setTimeout(function () {
			newBoard.move(boardMove);
		}, 300);
		currentMove++;
		move = gameHistory[currentMove];
	} else {
		var wrongAudio = new Audio("audio/wrong.mp3");
		wrongAudio.play();
		console.log("ELSE");
		chess.undo();
		return 'snapback';
	}
}

// Rerender cheess board to animate it 
function reRenderChessBoard() {
	$('#newBoard').hide().show(0);
}

function toggleFullScreen() {
	var elem = document.getElementById("fullscreen");
	if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen();
	}
}

function changeProgressBar(progressBarId, currentValue, minValue, maxValue){
	$("#"+progressBarId).attr("aria-valuenow", currentValue);
	$("#"+progressBarId).attr("aria-valuemin", minValue); 
	$("#"+progressBarId).attr("aria-valuemax", maxValue);
	var percentageValue = (currentValue/(maxValue-minValue))*100;
	console.log("Current", currentValue);
	console.log("Max value", maxValue);
	console.log("minvalue:", minValue);
	console.log(percentageValue);
	$("#"+progressBarId).css("width", percentageValue + '%');
}

// Event listeners for key bindings
document.addEventListener("keydown", function (e) {
	if (e.keyCode == 13) {
		toggleFullScreen();
	}
}, false);

// Button Functionality

$('#btnPreviousGame').on('click', function () {
	if (currentGameInPGN > 0) {
		currentGameInPGN--;
		loadBoard();
		reRenderChessBoard();
	}
})

$('#btnNextGame').on('click', function () {
	if (currentGameInPGN < gamesCountInPGN - 1) {
		console.log(currentGameInPGN);
		currentGameInPGN++;
		loadBoard(PGNFile);
		reRenderChessBoard();
	}
})

$('#btnHint').on('click', function () {
	// Find the squares to highlight
	var fromSquare = gameHistory[currentMove].from;
	var toSquare = gameHistory[currentMove].to;

	// Add the highlight
	boardElement.find('.square-' + fromSquare).addClass('highlight-white');
	boardElement.find('.square-' + toSquare).addClass('highlight-white');

	// Remove the classes after 2 seconds
	setTimeout(function () {
		boardElement.find('.square-' + fromSquare).removeClass('highlight-white');
		boardElement.find('.square-' + toSquare).removeClass('highlight-white');
	}, 2000);

})


// var pgnToTactics = function() {
// 	_get_file("../pgn/oneGame.pgn", function(response) {
// 		var aTacticPosition;

// 		// Get the fen position from pgn
// 		var fenElement = response.split("\n")[9];
// 		fenElement = fenElement.slice(6,fenElement.length - 2);
// 		console.log(fenElement);

// 		// Get the moves from the pgn
// 		var movesFromPgn = response.split("\n")[13];
// 		movesFromPgn = movesFromPgn.slice(3, movesFromPgn.length - 4);
// 		console.log(movesFromPgn);

// 	});
// }

// pgnToTactics();


/*
var tactics = [
	//['r2qkb1r/3bpp2/p1np1p2/1p3P2/3NP2p/2N5/PPPQB1PP/R4RK1 b kq - 0 1','...Bh6 Qd3 Qb6 Rad1 Qxd4+ Qxd4 Nxd4 Rxd4 Be3+'],
	//['6k1/5p1p/4p1p1/2p1P3/2P4P/3P2PK/R1Q3B1/1r1n2q1 b - - 0 1', '...Ra1 if Rxa1 Nf2+' ],
	//['3r2k1/4qppp/p7/1pp1n3/4P3/BP6/P2R1PPP/3Q2K1 b - - 0 1', '...Nf3+ gxf3 Qg5+' ],
	['6k1/5p2/6p1/3Q4/3P1K1P/5P2/1P2r1q1/R7 b - - 0 1', '...Qh2+ if Kg5 Qg3+ Kf6 Qf4+'],
	['3rnrk1/1b3pp1/1q2p1P1/p3P3/1p1N4/4Q3/PPP4P/2KR1R2 w - - 0 1', 'Qh3 fxg6 Rxf8+ Kxf8 Nxe6+'],
	['8/8/8/2Q5/8/3K4/1k6/q7 w - - 0 1', 'Qb4+ Ka2 Kc2 Qd1+ Kxd1 Ka1 Kc2 Ka2 Qa4#'],
	['r3k2r/4b2p/3pBp2/1bq5/1p2P3/3N4/PpP1Q1PP/1K1R1R2 w - - 0 1', 'Rf5 Qb6 Qh5+ Kd8 Rxb5'],
	['3r1k2/1b3p1p/p7/1pp4n/8/2PP1q1P/PPB2Q2/4RNK1 w - - 0 1', 'Qxc5+ Kg7 Qg5+'],
	['8/5b2/6p1/P6p/5k2/1PNn4/6P1/6K1 w - - 0 1', 'a6 if Be8 Nd5+ Ke5 Ne7'],

];
//End of tactics from the database.

var files = ["a", "b", "c", "d", "e", "f", "g", "h"];
var cleanedSolutions = [];
var moveCount = 0;

function findSum(total, num) {
	return total + num;
};

function initializeBoard() {
	var cfg = {
		draggable: true,
		position: 'start',
		//onDragStart: onDragStart,
		//onDrop: onDrop,
		//onSnapEnd: onSnapEnd
	};

	board = ChessBoard('board', cfg);
	//board.start;
	//board.move('g1-f3');

}; // end init()

// this functions matches the player move with that in tactics. If the move matches return true else false.
// it checks for the index of current move with the moves available in tactics. If the index is found, it return true.
function checkSolution() {
	var tmpTact = currentTactic[1].replace('...', '').split(" ");
	if (tmpTact.indexOf(currentMove.san) != -1) {
		return true;
	} else {
		return false;
	}
};

// store current tactic in memory so that we update the available moves
var currentTactic = [];

// this function updates the loaded tactics in memory. It removes the moves that have taken place by user or bot.
function updateTacticOnMoveEnd(currentMove) {
	// replace the ... if any and overwrite the current tactic array
	currentTactic[1] = currentTactic[1].replace('...', '');
	// array of available moves (both players)
	var tmpMoves = currentTactic[1].split(" ");
	// find index of current move played
	var idxOfCrntMv = tmpMoves.indexOf(currentMove.san);
	// remove the moves that have taken place already from the current tactics
	if (tmpMoves[1] == 'if' || tmpMoves[1] == 'or') {
		var addIdx = 3;
	} else {
		var addIdx = 2;
	}
	tmpMoves = tmpMoves.splice(idxOfCrntMv + addIdx, tmpMoves.length);
	// convert array to string and overwrite currentTactic moves
	currentTactic[1] = tmpMoves.join(" ");
};

// global variable to store current move info
var currentMove = {};

function loadTactic() {
	if (tactics.length == 0) {
		alert("sorular bitti...");
		// sayfa yönlendirme ekledin
		window.location = "http://www.satrancegitim.com";
		return false;
	}
	var tacticSolved = false;
	moveCount = 0;
	var randNum = 0;
	currentTactic = tactics[randNum];
	tactics.splice(randNum, 1);
	randNum++;

	//var randNum = Math.floor(Math.random() * tactics.length);
	//currentTactic = tactics[randNum];
	//tactics.splice(randNum,1);


	var board,
		game = new Chess(currentTactic[0]),
		statusEl = $('#status'),
		fenEl = $('#fen'),
		pgnEl = $('#pgn');

	// do not pick up pieces if the game is over
	// only pick up pieces for the side to move
	var onDragStart = function (source, piece, position, orientation) {
		if (tacticSolved) {
			return false;
		}
		if (game.game_over() === true ||
			(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
			(game.turn() === 'b' && piece.search(/^w/) !== -1)) {
			return false;
		}
	};

	//this function fires when the piece is dropped on a square
	var onDrop = function (source, target) {
		// see if the move is legal
		var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		});
		currentMove = move;
		if (move === null) {
			return 'snapback';
		} else if (checkSolution()) { // check if the move is according to the tactics or not.
			var tmpTact = currentTactic[1].replace('...', '').split(" ");
			var pos = board.position();
			// loop through the tactic array to find the next move for bot.
			for (var t in tmpTact) {
				// ignore cases like if, or, player current move (since the current tactic array has not been updated yet,
				// we need to ignore current move which is most likely to be present on the 0th index of array)
				if (tmpTact[t] == "if" || tmpTact[t] == "or" || tmpTact[t] == currentMove.san) {
					if (currentTactic[1].split(" ").length == 1) {
						tacticSolved = true;

						// Play the sound
						var ses = new Audio("audio/correct.mp3");
						ses.play();

						// Timeout function to continue for the next puzzle
						setTimeout(function () {
							$('#modal').trigger('click');
							//alert("Great! Click ok to continue with the next problem!");
							self = this;
							this.loadTactic();
						}, 1500);
					}
					continue;
				}

				//the computer will now make a move
				board.move(tmpTact[t]); // the ui
				game.move(tmpTact[t]); // the library chess.js
				updateTacticOnMoveEnd(currentMove);
				break;
			}
		} else {
			// undo the step if not according to the tactics but valid
			game.undo();
			var ses = new Audio("audio/wrong.mp3");
			ses.play();

			return 'snapback';
		}

		updateStatus();

	};

	// update the board position after the piece snap 
	// for castling, en passant, pawn promotion
	var onSnapEnd = function () {
		board.position(game.fen());
	};

	var updateStatus = function () {
		var status = '';
		var moveColor = 'Beyaz';
		if (game.turn() === 'b') {
			moveColor = 'Siyah';
		}

		if (game.in_checkmate() === true) {
			status = 'Game over, ' + moveColor + '\'Mat etti.';
		} else if (game.in_draw() === true) {
			status = 'Game over, Berabere';
		} else {
			status = ' Hamle ' + moveColor + 'ın';
			if (game.in_check() === true) {
				status += ', ' + moveColor + '\'şah çekti.';
			}
		}
		statusEl.html(status);
		fenEl.html(game.fen());
		pgnEl.html(game.pgn());
	};

	updateStatus();
	var cfg = {
		draggable: true,
		position: currentTactic[0],
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		moveSpeed: 'slow',
		snapbackSpeed: 500,
		dropOffBoard: 'snapback'
	};

	board = ChessBoard('board', cfg);
	position = board.position();
};
*/