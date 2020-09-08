const Evaluator = require('../models/evaluator.model');

const { getEvaluatorIdBySessionId } = require('../Controllers/evaluatorSessionController');

const auxObject = {};
auxObject.object = {};

auxObject.commentOnObject = {};
auxObject.commentOnComment = {};
auxObject.commentOnPost = {};
auxObject.commentOnQueima = {};
auxObject.commentOnBelle = {};
auxObject.commentOnSegredinho = {};

async function addConnectionBySessionId(sessionId, connection) {
    const userId = await getEvaluatorIdBySessionId(sessionId);
    
    if(userId) {
        auxObject[userId] = {
            connection: connection,
    
            object: {},
    
            commentOnObject: {},
            commentOnComment: {},
            commentOnPost: {},
            commentOnQueima: {},
            commentOnBelle: {},
            commentOnSegredinho: {},
        }
    }
}

async function addConnectionTo(sessionId, id, connection, which) {
    const userId = await getEvaluatorIdBySessionId(sessionId);

    if(userId) {
        auxObject[userId][which][id] = connection;

        if(auxObject[which][id]) {
            auxObject[which][id].unshift(userId);
        }

        else {
            auxObject[which][id] = [ userId ];
        }
    }
}

function requestFunction( request ) {
    //console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
    
    const wsConnection = request.accept(null, request.origin);

    wsConnection.on('message', async (message) => {
        //console.log(message);

        const dataFromClient = JSON.parse(message.utf8Data);
        //console.log(dataFromClient);

        if(dataFromClient.type === 'userConnection') {
            addConnectionBySessionId(dataFromClient.sessionId, wsConnection);
        }

        if(dataFromClient.type === 'objectConnection') {
            addConnectionTo(dataFromClient.sessionId, dataFromClient.objectNickname, wsConnection, "object");
        }

        if(dataFromClient.type.substring(0, 9) === 'commentOn') {
            addConnectionTo(dataFromClient.sessionId, dataFromClient.nickId, wsConnection, dataFromClient.type.replace('Connection', ''));
        }
        
        // if(dataFromClient.type === 'commentOnObjectConnection') {
        //     addConnectionTo(dataFromClient.sessionId, dataFromClient.objectNickname, wsConnection, "commentOnObject");
        // }

        // if(dataFromClient.type === 'commentOnCommentConnection') {
        //     addConnectionTo(dataFromClient.sessionId, dataFromClient.commentId, wsConnection, "commentOnComment");
        // }

        // if(dataFromClient.type === 'commentOnPostConnection') {
        //     addConnectionTo(dataFromClient.sessionId, dataFromClient.id, wsConnection, "commentOnPost");
        // }

        // if(dataFromClient.type === 'commentOnQueimaConnection') {
        //     addConnectionTo(dataFromClient.sessionId, dataFromClient.id, wsConnection, "commentOnQueima");
        // }

        // if(dataFromClient.type === 'commentOnBelleConnection') {
        //     addConnectionTo(dataFromClient.sessionId, dataFromClient.id, wsConnection, "commentOnBelle");
        // }

        if(dataFromClient.type === 'notificationConnection') {
            const userId = await getEvaluatorIdBySessionId(dataFromClient.sessionId);
            
            if(auxObject[userId]) {
                auxObject[userId].notification = wsConnection;
            }
        }

        if(dataFromClient.type === 'messageFromComments') {
            for(let uId of auxObject.object[dataFromClient.objectNickname]) {
                auxObject[uId].object[dataFromClient.objectNickname].sendUTF(message.utf8Data);
            }
        }

        if(dataFromClient.type.substring(0,14) === 'addedCommentOn') {
            const which = dataFromClient.type[5].toLowerCase() + dataFromClient.type.substring(6,30);
            
            for(let uId of auxObject[which][dataFromClient.nickId]) {
                auxObject[uId][which][dataFromClient.nickId].sendUTF(message.utf8Data);
            }
        }

        if(dataFromClient.type === 'notificationPostAdded') {
            const userId = await getEvaluatorIdBySessionId(dataFromClient.sessionId);

            Evaluator.findById(userId)
                .then(evaluator => {
                    for(let follower of evaluator.followedBy) {
                        if(auxObject[follower]) {
                            auxObject[follower].notification.sendUTF(message.utf8Data);
                        }
                    }
                })
                .catch(err => res.status(400).json('Error: ' + err));
        }

        if(dataFromClient.type === 'notificationCommentOnCommentAdded') {
            if(auxObject[dataFromClient.for[0]]) {
                auxObject[dataFromClient.for[0]].notification.sendUTF(message.utf8Data);
            }
        }

        if(dataFromClient.type === 'notificationObjectUpdatedByComment') {
            const notiMessage1 = JSON.stringify({
                notification: dataFromClient.notification1,
            });
            const notiMessage2 = JSON.stringify({
                notification: dataFromClient.notification2,
            });

            for(let uId of dataFromClient.for1) {
                if(auxObject[uId]) {
                    auxObject[uId].notification.sendUTF(notiMessage1);
                }
            }

            if(auxObject[dataFromClient.for2[0]]) {
                auxObject[dataFromClient.for2[0]].notification.sendUTF(notiMessage2);
            }
        }

        if(dataFromClient.type.substring(0,15) === 'closeConnection') {
            const which = dataFromClient.type[15].toLowerCase() + dataFromClient.type.substring(16,50);
            const userId = await getEvaluatorIdBySessionId(dataFromClient.sessionId);

            if(auxObject[userId]) {
                delete auxObject[userId][which][dataFromClient.nickId];
            }
        }

        //if (message.type === 'utf8') {
            //console.log('Received Message: ', message.utf8Data);

            // broadcasting message to all connected clients
            //const dataFromClient = JSON.parse(message.utf8Data);
            //addConnectionToObject(dataFromClient.objectId, wsConnection);

            //console.log(objects);

            //for(let )
            //wsConnection.sendUTF(message.utf8Data);
            //console.log('sent Message to: ', wsConnection);
        //}

        //console.log("users connected: " + (Object.keys(auxObject).length - 6));
        //console.log(auxObject);
        // if(auxObject["5f202858ed65823c88f6752b"]) {
        //     console.log(auxObject["5f202858ed65823c88f6752b"]);
        //     console.log(Object.keys(auxObject["5f202858ed65823c88f6752b"].commentOnObject).length);
        // }
        //console.log("obj: " + Object.keys(auxObject.object).length);
        //console.log("com: " + Object.keys(auxObject.commentOnObject.ema).length);
        //console.log("post: " + Object.keys(auxObject.commentOnPost).length);
    });

}

module.exports = requestFunction;
