function calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate) {
    //calculates evaluated's new rate

    //g(x,y)= ((100)/(46050)ln(x)+(1)/(4472120) (y*10000000000)^((1)/(2))) (-1000)+100
    const oWeight = ((100/46050) * Math.log(evaluatedRateNumber) + 
        (1/4472120) * Math.pow((evaluatedRate * 10000000000),(1/2)))*(-1000) + 100 ;

    let aux;

    if((evaluatorRate - 0.5) < 0) {
        aux = 0;
    }

    else {
        aux = evaluatorRate - 0.5;
    }

    //h(x,y) = (100)/(46050)ln(x)+(1)/(4472120) ((y - 0.5)*10000000000)^((1)/(2))
    const eWeight = (100/46050) * Math.log(evaluatorRateNumber) + 
        (1/4472120) * Math.pow((aux * 10000000000),(1/2));
    
    //finalWeight = eWeight * (oWeight/100)
    const finalWeight = eWeight * (oWeight/100);

    //newRate = (1*currentRate + finalWeight*submittedRate)/1+finalWeight
    let newRate = (evaluatedRate + finalWeight * submittedRate ) / (1 + finalWeight);

    if(newRate > 5) {
        newRate = 5;
    }
    else if(newRate < 0) {
        newRate = 0;
    }

    return newRate;
}

module.exports = calculateRate;