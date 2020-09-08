const router = require('express').Router();

const Evaluator = require('../models/evaluator.model');

const Notification = require('../models/notification.model');

const { getEvaluatorIdBySessionId } = require("../Controllers/evaluatorSessionController");

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');

router.route('/get_notifications').post(async (req, res) => {
    
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => {

            Notification.find({
                "_id": { $in: evaluator.notifications }
            }).sort({ createdAt: -1, }).limit(300)
                .then(notifications => res.json(notifications))
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

router.route('/set_notifications_as_read').post(async (req, res) => {
    
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => {

            Notification.find({
                "_id": { $in: evaluator.notifications }
            }).sort({ createdAt: -1, }).limit(300)
                .then(notifications => {
                    for(let notification of notifications) {
                        if(!(notification.notificationRead)) {
                            
                            notification.notificationRead = true;

                            notification.save()
                                .then(() => {})
                                .catch(err => res.status(400).json('Error: ' + err));

                        }
    
                        else {
                            break
                        }
                    }

                    res.json({});
                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

module.exports = router;