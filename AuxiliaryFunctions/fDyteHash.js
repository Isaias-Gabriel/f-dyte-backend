const hashAuxObject = {
    "a": "a2", "b": "a3", "c": "a5", "d": "a7", "e": "a1a1", "f": "a1a3",
    "g": "a1a7", "h": "a1a9", "i": "a2a3", "j": "a2a9", "k": "a3a1", "l": "a3a7",
    "m": "a4a1", "n": "a4a3", "o": "a4a7", "p": "a5a3", "q": "a5a9", "r": "a6a1",
    "s": "a6a7", "t": "a7a1", "u": "a7a3", "v": "a7a9", "w": "a8a3", "x": "a8a9",
    "y": "a9a7", "z": "a1a1", " ": "a1a3",
    "0": "a1a7", "1": "a1a9", "2": "a1a1a3", "3": "a1a2a7", "4": "a1a3a1", "5": "a1a3a7",
    "6": "a1a3a9", "7": "a1a4a9", "8": "a1a5a1", "9": "a1a5a7",
}

const fDyteHash = {};

fDyteHash.hash = (text) => {
    let auxString = "";
    
    for(let letter of text) {
        if(hashAuxObject[letter]){
            auxString += hashAuxObject[letter];
        }

        else {
            auxString += 'a1a6a3';
        }
    }

    return auxString;
}

fDyteHash.compare = (hashedText, compareWithHashedText) => {
    return (hashedText === fDyteHash.hash(compareWithHashedText));
}

module.exports = fDyteHash;
