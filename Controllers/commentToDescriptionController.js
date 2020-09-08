const CommentToDescription = require('../models/commentToDescription.model');
const commentToDescriptionController = {};

async function removeOutOfTimeIntervalElements(objectId, commentId) {
    //console.log('entered function');
    //24h = 86400s
    const [ tctd ] = await CommentToDescription.find({
        'auxId': objectId + commentId,
    }, { auxObject: 1 });
    const iLen = tctd.auxObject[objectId + commentId].length;

    //console.log(tctd);

    const storedTimes = tctd.auxObject[objectId + commentId].slice().reverse();

    for(let timeInMilliseconds of storedTimes) {
        //console.log(timeInMilliseconds)
        if(( Date.now() / 1000) - (timeInMilliseconds / 1000) > 86400 ) {
            tctd.auxObject[objectId + commentId].pop();
        }

        else {
            break;
        }
        
    }

    //console.log(tctd);

    const fLen = tctd.auxObject[objectId + commentId].length;

    if(!(iLen === fLen)) {
        tctd.markModified('auxObject');

        tctd.save();
    }
    //console.log('finished function');
}

function checkForEachSpot(commentRateNumber, 
    onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
    difference) {
    
    //if there's no comment on spot 1 (hence nor in 2 nor 3) and the commentRateNumber
    //qualifies according to the rule, then the comment can become a description
    if(!(onSpot1RateNumber)) {
        return (commentRateNumber > difference ? [true, 1] : [false, 0]);
    }

    else if(!(onSpot2RateNumber)) {
        return (commentRateNumber > difference ? [true, 2] : [false, 0]);
    }

    else if(!(onSpot3RateNumber)) {
        return (commentRateNumber > difference ? [true, 3] : [false, 0]);
    }

    //if all spots have comments already
    else {
        if(commentRateNumber > onSpot1RateNumber) {
            return [ true, 1];
        }

        else if(commentRateNumber > onSpot2RateNumber) {
            return [ true, 2];
        }

        else if(commentRateNumber > onSpot3RateNumber) {
            return [ true, 3];
        }

        //if commentRateNumber is not greater than any of the comments rate number,
        //it can't become a description
        else {
            return [ false, 0]
        }

    }

}

function commentCanBecomeDescription(objectRateNumber,
    commentRateNumber, onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber) {

    if( 0 <= objectRateNumber <= 99) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            10);
    }

    else if( 100 <= objectRateNumber <= 999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            100);
    }

    else if( 10000 <= objectRateNumber <= 99999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            200);
    }

    else if( 10000 <= objectRateNumber <= 99999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            500);
    }

    else if( 100000 <= objectRateNumber <= 999999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            1000);
    }

    else if( 1000000 <= objectRateNumber <= 499999999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            2000);
    }

    else if( 500000000 <= objectRateNumber <= 999999999) {
        return checkForEachSpot(commentRateNumber, 
            onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber,
            5000);
    }
}

//rateInfo is basically a date
commentToDescriptionController.commentToDescription = async (
    objectId, objectRateNumber, commentId,
    commentOnSpot1Id, commentOnSpot2Id, commentOnSpot3Id,
    rateInfo,
) => {
    
    console.log({
        objectId, objectRateNumber, commentId,
        commentOnSpot1Id, commentOnSpot2Id, commentOnSpot3Id,
        rateInfo,
    })

    const [ rctdd ] = await CommentToDescription.find({
        'auxId': objectId + commentId,
    }, { auxId: 1, _id: 0 });

    console.log(rctdd);
    
    if(rctdd) {

        delete rctdd;

        let onSpot1RateNumber = undefined, onSpot2RateNumber = undefined, onSpot3RateNumber = undefined;

        //firt, remove all rateInfo for comment, commentOnSpot1, ...2 and ...3 
        //that has been in the array for more than 24 hours
        //24h = 86400s
        await removeOutOfTimeIntervalElements(objectId, commentId);

        const [ rctdd1 ] = await CommentToDescription.find({
            'auxId': objectId + commentOnSpot1Id,
        }, { auxObject: 1 });
    
        console.log(rctdd1);

        if(rctdd1) {
            await removeOutOfTimeIntervalElements(objectId, commentOnSpot1Id);
            onSpot1RateNumber = rctdd1.auxObject[objectId + commentOnSpot1Id].length;

            console.log({onSpot1RateNumber})

            const [ rctdd2 ] = await CommentToDescription.find({
                'auxId': objectId + commentOnSpot2Id,
            }, { auxObject: 1 });
        
            console.log(rctdd2);

            if(rctdd2) {
                await removeOutOfTimeIntervalElements(objectId, commentOnSpot2Id);
                onSpot2RateNumber = rctdd2.auxObject[objectId + commentOnSpot2Id].length;

                console.log({onSpot1RateNumber})

                const [ rctdd3 ] = await CommentToDescription.find({
                    'auxId': objectId + commentOnSpot3Id,
                }, { auxObject: 1 });
            
                console.log(rctdd3);

                if(rctdd3) {
                    await removeOutOfTimeIntervalElements(objectId, commentOnSpot3Id);
                    onSpot3RateNumber = rctdd3.auxObject[objectId + commentOnSpot3Id].length;

                    console.log({onSpot1RateNumber})
                }
            }
            
            
        }

        const [ temp_ctdd ] = await CommentToDescription.find({
            'auxId': objectId + commentId,
        }, { auxObject: 1 });

        const commentRateNumber = temp_ctdd.auxObject[objectId + commentId].unshift(rateInfo);

        console.log({commentRateNumber});

        temp_ctdd.markModified('auxObject');

        temp_ctdd.save();
        
        if((commentId === commentOnSpot1Id) || (commentId === commentOnSpot2Id) || (commentId === commentOnSpot3Id)) {
            console.log('already on one spot');

            return [ false, 0];
        }

        else {
            return commentCanBecomeDescription(objectRateNumber,
                commentRateNumber, onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber);
        }
        
        
        // //console.log(objectRateNumber,
        // //    commentRateNumber, onSpot1RateNumber, onSpot2RateNumber, onSpot3RateNumber)
        // //console.log(objects)
         response;
        
        
    }
    //if the object is not on objects, put it and put the comment's list of rateInfos in it
    else {
        delete rctdd;

        const newDoc = new CommentToDescription({
            auxId: objectId + commentId,
            auxObject: {
                [ objectId + commentId ]: [ rateInfo ],
            },
        });

        newDoc.save();

        return [ false, 0];
    }

    
};

module.exports = commentToDescriptionController;