const Session = require("../models/session.model");

const sessions = {};
const evaluatorController = {};

evaluatorController.evaluatorSessionController = (sessionId, evaluatorId) => {

    if(sessionId && evaluatorId !== undefined){
        const newSession = new Session({
            sessionIdEvaluatorId: [sessionId, evaluatorId],
        })

        newSession.save()
            .then(session => {
                return(session);
            })
            .catch(err => {
                return(err);
            })
        


    }
    
    return sessions;
};


//receives student's session id and returns its corespondent id as a string
evaluatorController.getEvaluatorIdBySessionId = async (sessionId) => {
    
    const [ session ] = await Session.find({
        sessionIdEvaluatorId: sessionId,
    });

    if(session) {
        const evId = session.sessionIdEvaluatorId[1].toString();
        return evId;
    }

    else {
        return undefined;
    }
        // .then(([session]) => {
        //     //console.log(session);
        //     if(session) {
        //         const evId = session.sessionIdEvaluatorId[1].toString();
        //         return evId;
        //     }

        //     else {
        //         return 'cavalo';
        //     }
        // })
        // .catch(err => {
        //     return(err);
        // })
}

//receives student's session id and delete it from the sessions object
evaluatorController.deleteSession = (sessionId) => {
    Session.findOneAndDelete({
        sessionIdEvaluatorId: sessionId,
    })
        .then(() => {
            return '';
        })
        .catch(err => {
            return(err);
        });
}

module.exports = evaluatorController;