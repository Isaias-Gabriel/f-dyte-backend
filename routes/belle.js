const router = require('express').Router();
const Mathjs = require('mathjs');
const upload = require("./../config/multer");

const Evaluator = require('../models/evaluator.model');

const RateHistory = require('../models/rateHistory.model');

const Belle = require('../models/belle.model');

const { getEvaluatorIdBySessionId,  } = require("../Controllers/evaluatorSessionController");

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

//create belle
router.post("/belle", upload.array("files", 6), async (req, res) => {
    const { caption, sessionId } = req.body;
    const evaluadorId = await getEvaluatorIdBySessionId(sessionId);

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push(file.location)
    })

    const newBelle = new Belle({ content: {
        caption: caption,
        urls: urls,
    }});

    newBelle.save()
        .then(belle => {

            Evaluator.findById(evaluadorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            belle._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "belle",
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

                            evaluator.ratedBelles.push(belle._id);
                            evaluator.rateHistory.push(rateHistory._id); 
                            evaluator.belles.push(belle._id)
                                    
                            evaluator.save()
                                .then(() => {
                                    belle.rateHistory.push(rateHistory._id);
                                    belle.rate = evaluator.rate;
                                    belle.rateNumber = 1;

                                    belle.userName = evaluator.name;
                                    belle.userId = evaluator._id;
                                    belle.userUsername = evaluator.username;
                                    belle.userProfilePictureUrl = evaluator.profilePictureUrl;

                                    belle.save()
                                        .then(updatedBelle => res.json(updatedBelle))
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

//update belle rate
router.route('/update_belle_rate').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Belle.findById(req.body.belleId || req.body.id)
        .then(belle => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const evaluatorRate = Number(evaluator.rate);
                    const evaluatorRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.belleRate || req.body.rate);

                    const evaluatedRate = Number(belle.rate);
                    const evaluatedRateNumber = Number(belle.rateNumber);

                    const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            belle._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "belle",
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
                            
                            belle.rate = newRate;
                            belle.rateNumber = evaluatedRateNumber + 1;
                            belle.rateHistory.push(rateHistory._id);

                            belle.save()
                                .then(updatedBelle => {
                                    evaluator.ratedBelles.push(updatedBelle._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json(updatedBelle.rate))
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

//get all the belles from one user
router.route('/get_all_belles').post(async (req, res) => {

    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => {

            Evaluator.find({
                username: req.body.username,
            })
                .then(([profile]) => {
                    
                    const ratedBelles = belongToBoth(evaluator.ratedBelles, profile.belles);

                    Belle.find({
                        userUsername: req.body.username,
                    }).sort({ createdAt: -1, })
                        .then(belles => {

                            res.json({
                                belles: belles,
                                ratedBelles: ratedBelles,
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

//delete a belle
router.route('/delete_belle').post(async (req, res) => {
    Belle.findByIdAndDelete(req.body.id)
        .then(() => res.json())
        .catch(err => res.status(400).json('Error: ' + err));
})


module.exports = router;