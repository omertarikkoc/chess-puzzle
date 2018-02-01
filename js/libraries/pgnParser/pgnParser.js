var Parser = function() {
    var parsedData = {};
    var dataToParse = "";

    this.parseToJSON = function(pngData, cb) {
        dataToParse = typeof pngData == 'undefined' ? dataToParse : pngData;

        if (dataToParse != "") {
            var tmpGames = dataToParse.split(/^([0-9]+.*)(1-0|0-1|1\/2-1\/2)$/m);
            var parsedData = [];


            // Merge odd with pair positions of array together
            for (var i = 0; i <= tmpGames.length; i++) {
                if ((i == 0 || (i % 3) == 0) && (i + 1) <= tmpGames.length && typeof tmpGames[i + 1] !== 'undefined') {
                    // Merge with last i
                    var currentGame = (tmpGames[i] + tmpGames[i + 1]).split('\n\n');

                    var headers = currentGame[0].replace(/^\n|\[.*(?=(".*"))|\"|\]/gm, '').split('\n');
                    var body = currentGame[1].replace();
                    var info = {};

                    try {
                        // PGN requires these fields in this particular order. File not valid if not the case.
                        info['event'] = headers[0];
                        info['site'] = headers[1];
                        info['date'] = new Date (headers[2]);
                        info['round'] = headers[3];
                        info['white'] = headers[4];
                        info['black'] = headers[5];
                        info['result'] = headers[6];
                    } catch (e) {
                        throw {message : "Invalid PGN File.", name : "InvalidPGNFileException"};
                    }

                    //Headers
                    parsedData.push({
                        info : info,
                        moves : body
                    });
                }
            }
        }

        if (typeof cb == 'function') {
            return cb(parsedData);
        }

        if (typeof pngData == 'function') {
            return pngData(parsedData);
        }
        
        return parsedData;
    };

    this.loadFile = function() {

    }
};
