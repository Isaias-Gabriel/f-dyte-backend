const router = require('express').Router();
const Mathjs = require('mathjs');
const upload = require("./../config/multer");

const Evaluator = require('../models/evaluator.model');

const RateHistory = require('../models/rateHistory.model');

const Queima = require('../models/queima.model');

const { 
    evaluatorSessionController, getEvaluatorIdBySessionId, deleteSession
} = require("../Controllers/evaluatorSessionController");

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

//create queima
router.post("/queima", upload.array("files", 6), async (req, res) => {
    const { caption, sessionId } = req.body;
    const evaluadorId = await getEvaluatorIdBySessionId(sessionId);

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push(file.location)
    })

    const newQueima = new Queima({ content: {
        caption: caption,
        urls: urls,
    }});

    newQueima.save()
        .then(queima => {

            Evaluator.findById(evaluadorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            queima._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "queima",
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

                            evaluator.ratedQueimas.push(queima._id);
                            evaluator.rateHistory.push(rateHistory._id); 
                            evaluator.queimas.push(queima._id)
                                    
                            evaluator.save()
                                .then(() => {
                                    queima.rateHistory.push(rateHistory._id);
                                    queima.rate = evaluator.rate;
                                    queima.rateNumber = 1;

                                    queima.userName = evaluator.name;
                                    queima.userId = evaluator._id;
                                    queima.userUsername = evaluator.username;
                                    queima.userProfilePictureUrl = evaluator.profilePictureUrl;

                                    queima.save()
                                        .then(updatedQueima => res.json(updatedQueima))
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

//update queima rate
router.route('/update_queima_rate').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Queima.findById(req.body.queimaId || req.body.id)
        .then(queima => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const evaluatorRate = Number(evaluator.rate);
                    const evaluatorRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.queimaRate || req.body.rate);

                    const evaluatedRate = Number(queima.rate);
                    const evaluatedRateNumber = Number(queima.rateNumber);

                    const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            queima._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "queima",
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
                            
                            queima.rate = newRate;
                            queima.rateNumber = evaluatedRateNumber + 1;
                            queima.rateHistory.push(rateHistory._id);

                            queima.save()
                                .then(updatedQueima => {
                                    evaluator.ratedQueimas.push(updatedQueima._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json({
                                            rate: updatedQueima.rate,
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

//get all the queimas from one user
router.route('/get_all_queimas').post(async(req, res) => {

    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => {

            Evaluator.find({
                username: req.body.username,
            })
                .then(([profile]) => {
                    
                    const ratedQueimas = belongToBoth(evaluator.ratedQueimas, profile.queimas);

                    Queima.find({
                        userUsername: req.body.username,
                    }).sort({ createdAt: -1, })
                        .then(queimas => {

                            res.json({
                                queimas: queimas,
                                ratedQueimas: ratedQueimas,
                            })
                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                        
                })
                .catch(err => res.status(400).json('Error: ' + err));
                
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get all the posts from one user
//use when the evaluator update its personal info
// router.route('/get_all_posts').post(async (req, res) => {
//     const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

//     Evaluator.find({evaluatorId})
//         .then(evaluator => {
//             Post.find({
//                 "_id": { $in: evaluator.posts }
//             }).sort({ createdAt: -1, })
//                 .then(posts => res.json(posts))
//                 .catch(err => res.status(400).json('Error: ' + err));

//         })
//         .catch(err => res.status(400).json('Error: ' + err));

// })

//delete a queima
router.route('/delete_queima').post((req, res) => {
    Queima.findByIdAndDelete(req.body.id)
        .then(() => res.json())
        .catch(err => res.status(400).json('Error: ' + err));
})


module.exports = router;