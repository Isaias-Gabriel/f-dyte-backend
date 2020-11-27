const router = require('express').Router();
const upload = require("../config/multer");

const FdObject = require('../models/fdObject.model');
const RateHistory = require('../models/rateHistory.model');
const Evaluator = require('../models/evaluator.model');

const { getEvaluatorIdBySessionId,  } = require('../Controllers/evaluatorSessionController');

const canRateAgain = require('../AuxiliaryFunctions/canRateAgain');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

//create object
router.post("/create_object", upload.array("files", 20), async (req, res) => {

    let { name, nickname, categories, description, rate } = req.body;
    const creator = await getEvaluatorIdBySessionId(req.body.sessionId);
    const rateNumber = 1;

    //get files urls
    urls = [[], [[], [], [], [], []]];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls[0].push(file.location)
    })

    categories = categories.split(',');

    const newObject = new FdObject({ creator, name, nickname, categories: [ categories ], description: [ [description], [[], [], []] ], urls, rate, rateNumber, });

    newObject.save()
        .then(object => {

            Evaluator.findById(creator)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            object._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "object",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            object.rate,
                        ],
                        submittedRate: rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ],
                    });

                    newRateHistory.save()
                        .then(rateHistory => {

                            evaluator.ratedObjects.push(object._id);
                            evaluator.rateHistory.push(rateHistory._id);
                            
                            evaluator.save()
                                .then(() => {
                                    object.rateHistory.push(rateHistory._id);

                                    object.save()
                                        .then(object => res.json(object.nickname))
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

//update object's rate
router.route('/update_object_rate').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);
    
    FdObject.findById(req.body.objectId || req.body.id)
    .then(object => {

        Evaluator.findById(evaluatorId)
            .then(evaluator => {

                const evaluatorRate = Number(evaluator.rate);
                const evaluatorRateNumber = Number(evaluator.rateNumber);

                const submittedRate = Number(req.body.rateToSubmit || req.body.rate);

                const evaluatedRate = Number(object.rate);
                const evaluatedRateNumber = Number(object.rateNumber);

                const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                const newRateHistory = new RateHistory({
                    evaluatorEvaluatedRelation: [
                        evaluator._id,
                        object._id,
                    ],
                    evaluatorEvaluatedTypesRelation: [
                        "evaluator",
                        "object",
                    ],
                    evaluatorEvaluatedRateRelation: [
                        evaluatorRate,
                        newRate,
                    ],
                    submittedRate: submittedRate,
                    evaluatorEvaluatedRateNumberRelation: [
                        evaluatorRateNumber,
                        evaluatedRateNumber + 1,
                    ],
                });

                newRateHistory.save()
                    .then(rateHistory => {
                        
                        object.rate = newRate;
                        object.rateNumber = evaluatedRateNumber + 1;
                        object.rateHistory.push(rateHistory._id);
                        
                        object.save()
                            .then(updatedObject => {
                                evaluator.ratedObjects.push(updatedObject._id);
                                evaluator.rateHistory.push(rateHistory._id);

                                evaluator.save()
                                    .then(() => res.json(updatedObject))
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

router.route('/add_follower_to_object').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    FdObject.find({
        nickname: req.body.nickname,
    })
        .then(([ object ]) => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {
                    evaluator.followedObjects.unshift(object._id);
                    evaluator.markModified('followedObjects');

                    evaluator.save()
                        .then(() => {
                            object.followedBy.unshift(evaluator._id);
                            object.markModified('followedBy');

                            object.save()
                                .then(() => {
                                    res.json(object.nickname);
                                })
                                .catch(err => res.status(400).json('Error: ' + err));

                        })
                        .catch(err => res.status(400).json('Error: ' + err));

                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get complete object info
router.route('/complete_object_info/:nickname').get((req, res) => {
    FdObject.find({
        nickname: req.params.nickname
    })
        .then(([ object ]) => {
            res.json({
                object: object,
                followersNumber: object.followedBy.length,
            })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get and show object
// router.route('/object/:id').get((req, res) => {
//     //do some validation to permit or not the evaluator to evaluate the current object

//     Object.findById(req.params.id)
//         .then(object => res.json(object))
//         .catch(err => res.status(400).json('Error: ' + err));
// });

//get best rated objects
router.route('/five_best').get((req, res) => {
    FdObject.find({
        rate: { $gt: 4 },
    }).sort({ rate: -1, }).limit(5)
        .then(response => res.json(response))
        .catch(err => res.status(400).json('Error: ' + err));
})

router.route('/home').get(async (req, res) => {
    Evaluator.find()
        .then(evaluators => res.json(evaluators))
        .catch(err => res.status(400).json('Error: ' + err));
});

//get worst rated objects
router.route('/five_worst').get((req, res) => {
    FdObject.find({
        rate: { $lt: 1 },
    }).sort({ rate: 1, }).limit(5)
        .then(response => res.json(response))
        .catch(err => res.status(400).json('Error: ' + err));
})

//get the last created objects
router.route('/latest').get((req, res) => {
    FdObject.find().sort({ createdAt: -1, }).limit(5)
        .then(response => res.json(response))
        .catch(err => res.status(400).json('Error: ' + err));
})

//tells if a user can rate an object or not
router.route('/user_can_rate_or_follow_object').post((req, res) => {
    FdObject.find({
        nickname: req.body.objectNickname
    })
    .then(async ([ evaluatedObject ]) => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {

                const isFollowed = evaluatedObject.followedBy.includes(evaluator._id);

                //if the evaluated id is in the ratedEvaluators array, it will return true, 
                //which means the user can't rate that evaluator
                let canBeRated = !(evaluator.ratedObjects.includes(evaluatedObject._id));
                
                RateHistory.find({
                    evaluatorEvaluatedRelation: [ evaluator._id, evaluatedObject._id ]
                }).sort({ createdAt: -1, })
                    .then(rateHistories => {
                        
                        const rateHistory = rateHistories[0];
                        
                        //if the evaluator had already rated the object, checks if it can rate again according to the rerating rule
                        if(!(canBeRated)) {
                            
                            //returning true means the user can rate the object again according to the rerating rules
                            canBeRated = canRateAgain(evaluatedObject.rateNumber, rateHistory.evaluatorEvaluatedRateNumberRelation[1]);

                            //then remove that object id from evaluators.ratedObjects array
                            if(canBeRated) {

                                Evaluator.findByIdAndUpdate(evaluator._id, {
                                    $pull: { ratedObjects: evaluatedObject._id }
                                }, {
                                    "useFindAndModify": false
                                })
                                    .then(() => {
                                        res.json({
                                            canBeRated: canBeRated,
                                            isFollowed: isFollowed,
                                        });
                                    })
                                    .catch(err => res.status(400).json('Error: ' + err));
                            }

                            else {
                                res.json({
                                    canBeRated: canBeRated,
                                    isFollowed: isFollowed,
                                });
                            }
                            
                        }

                        else {
                            res.json({
                                canBeRated: canBeRated,
                                isFollowed: isFollowed,
                            });
                        }

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//tells if a username is already being used
router.route('/object_nickname_in_use').post((req, res) => {
    FdObject.find({
        nickname: req.body.nickname
    })
    .then(response => {
        //if the username is available it will return false (in other words, 'username in use' is false)
        if(!(response.length)) {
            res.json(false);
        }
        else {
            res.json(true);
        }
    })
    .catch(err => res.status(400).json('Error: ' + err));
})

router.route('/update_objects').get((req, res) => {
    FdObject.find()
        .then(objects => {
            for(let object of objects) {
                //let { category, description, urls } = object;
                // if(typeof categories === typeof '') {
                //     categories = [categories.split(', ')];
                // }

                // else {
                //     categories = [categories];
                // }

                // urls = [urls];
                // description = [description];
                // category = [[category]];
                
                //object.categories[0].push('object');


                //object.categories[1] = [];
                object.description[1] = [ [], [], [] ];
                object.urls[1] = [ [], [], [], [], [] ];

                //object.markModified('categories');
                object.markModified('description');
                object.markModified('urls');

                object.save()
                    .then(() => {

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            }

            res.json("nha");
        })
})

//search for objects and/or evaluators
router.route('/search_for_object_or_evaluator').post((req, res) => {
    const searchFor = req.body.searchFor;
  
    FdObject.find({
        $or:[
            { "nickname": {$regex: searchFor, $options: "i"}, },
            { "name": {$regex: searchFor, $options: "i"}, }
        ]
    }, 'id name nickname urls type').limit(10)
        .then(objects => {

            Evaluator.find({
                $or:[
                    { "username": {$regex: searchFor, $options: "i"}, },
                    { "name": {$regex: searchFor, $options: "i"}, }
                ]
            }, 'id name username profilePictureUrl type').limit(10)
                .then(evaluators => {
                    res.json(objects.concat(evaluators));
                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));
  
})
  

//delete an object
// router.route('/delete_object/:id').delete((req, res) => {
//     Object.findByIdAndDelete(req.params.id)
//         .then(() => res.json('Object deleted.'))
//         .catch(err => res.status(400).json('Error: ' + err));
// })



module.exports = router;