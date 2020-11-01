const router = require('express').Router();
const Mathjs = require('mathjs');
const upload = require("./../config/multer");

const Evaluator = require('../models/evaluator.model');

const Segredinho = require('../models/segredinho.model');

const RateHistory = require('../models/rateHistory.model');

const Notification = require('../models/notification.model');

const { 
    evaluatorSessionController, getEvaluatorIdBySessionId, deleteSession
} = require("../Controllers/evaluatorSessionController");

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

require('dotenv').config();

//create segredinho
router.route('/post_segredinho').post(async (req, res) => {
    const { hiddenMessage, originalMessage, sessionId } = req.body;
    const evaluadorId = await getEvaluatorIdBySessionId(sessionId);

    const newSegredinho = new Segredinho({ content: {
            text: hiddenMessage,
        },
        originalText: originalMessage,
    });

    newSegredinho.save()
        .then(segredinho => {

            Evaluator.findById(evaluadorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            segredinho._id,
                        ],        
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "segredinho",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            evaluator.rate,
                        ],
                        submittedRate: evaluator.rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ],
                    });

                    newRateHistory.save()
                        .then(rateHistory => {

                            evaluator.ratedSegredinhos.push(segredinho._id);
                            evaluator.rateHistory.push(rateHistory._id); 
                            evaluator.segredinhos.push(segredinho._id)
                                    
                            evaluator.save()
                                .then(() => {
                                    segredinho.rateHistory.push(rateHistory._id);
                                    segredinho.rate = evaluator.rate;
                                    segredinho.rateNumber = 1;

                                    segredinho.userName = 'User X';
                                    segredinho.userId = evaluator._id;
                                    segredinho.userUsername = evaluator.username;
                                    segredinho.userProfilePictureUrl = process.env.AWS_BUCKET_URL + 
                                        "defaultSegredinhoEvaluatorProfilePicture.png";

                                    segredinho.save()
                                        .then(updatedSegredinho => {

                                            // const newNotification = new Notification({
                                            //     content: {
                                            //         caption: evaluator.name + ' just posted something',
                                            //         text: content,
                                            //         url: urls[0],
                                            //     },
                                            //     userProfilePictureUrl: evaluator.profilePictureUrl,
                                            //     link: '/post/' + updatedSegredinho._id,
                                            //     notificationRead: false,
                                            // })
                                        
                                            // newNotification.save()
                                            //     .then(notification => {
                                            //         for(let follower of evaluator.followedBy) {
                                                        
                                            //             Evaluator.findById(follower)
                                            //                 .then(evaluator => {
                                            //                     evaluator.notifications.unshift(notification._id)
                                        
                                            //                     evaluator.markModified('notifications')
                                        
                                            //                     evaluator.save()
                                            //                         .then(() => {})
                                            //                         .catch(err => res.status(400).json('Error: ' + err));
                                        
                                            //                 })
                                            //                 .catch(err => res.status(400).json('Error: ' + err));
                                        
                                            //         }

                                                    res.json({
                                                        segredinho: updatedSegredinho,
                                                    });

                                                // })
                                                // .catch(err => res.status(400).json('Error: ' + err));

                                        })
                                        .catch(err => res.status(400).json('Error: ' + err));
                                    
                                })
                                .catch(err => res.status(400).json('Error: ' + err));  

                        })
                        .catch(err => res.status(400).json('Error: ' + err));

                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

});

//update rate
router.route('/update_segredinho_rate').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Segredinho.findById(req.body.id )
        .then(segredinho => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const evaluatorRate = Number(evaluator.rate);
                    const evaluatorRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.rate);

                    const evaluatedRate = Number(segredinho.rate);
                    const evaluatedRateNumber = Number(segredinho.rateNumber);

                    const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            segredinho._id,
                        ],        
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "segredinho",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluatorRate,
                            newRate,
                        ],
                        submittedRate: submittedRate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluatorRateNumber,
                            evaluatedRateNumber + 1,
                        ]
                    });

                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            segredinho.rate = newRate;
                            segredinho.rateNumber = evaluatedRateNumber + 1;
                            segredinho.rateHistory.push(rateHistory._id);

                            segredinho.save()
                                .then(updatedSegredinho => {
                                    evaluator.ratedSegredinhos.push(updatedSegredinho._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json({
                                            rate: updatedSegredinho.rate,
                                        }))
                                        .catch(err => res.status(400).json('Error: ' + err));
                                    
                                })
                                .catch(err => res.status(400).json('Error: ' + err));

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                    
                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

module.exports = router;