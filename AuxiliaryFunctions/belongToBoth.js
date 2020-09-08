//get two arrays and return a third array with all the elements that belong to the both first arrays
function belongToBoth(array1, array2) {
    array3 = [];

    if(array1.length < array2.length) {
        array1.map(element => {
            if(array2.includes(element)){
                array3.push(element);
            }
        })
    }
    
    else {
        array2.map(element => {
            if(array1.includes(element)){
                array3.push(element);
            }
        })
    }

    return array3;
}

module.exports = belongToBoth;