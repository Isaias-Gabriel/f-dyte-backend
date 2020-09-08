
function canRateAgain(evaluatedCurrentRateNumber, evaluatedOldRateNumber) {
    if( 0 <= evaluatedOldRateNumber <= 99) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 10) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 100 <= evaluatedOldRateNumber <= 999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 100) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 10000 <= evaluatedOldRateNumber <= 99999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 200) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 10000 <= evaluatedOldRateNumber <= 99999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 500) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 100000 <= evaluatedOldRateNumber <= 999999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 1000) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 1000000 <= evaluatedOldRateNumber <= 499999999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 2000) {
            return true;
        }
        else {
            return false;
        }
    }

    else if( 500000000 <= evaluatedOldRateNumber <= 999999999) {
        if(evaluatedCurrentRateNumber > evaluatedOldRateNumber + 5000) {
            return true;
        }
        else {
            return false;
        }
    }

}

module.exports = canRateAgain;