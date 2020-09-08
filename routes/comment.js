const router = require('express').Router();
const path = require("path");
const Mathjs = require('mathjs');

const upload = require('./../config/multer');

const Evaluator = require('../models/evaluator.model');

const Comment = require('../models/comment.model');

const Post = require('../models/post.model');
const Segredinho = require('../models/segredinho.model');
const Queima = require('../models/queima.model');
const Belle = require('../models/belle.model');

const RateHistory = require('../models/rateHistory.model');

const Notification = require('../models/notification.model');

const { getEvaluatorIdBySessionId,  } = require("../Controllers/evaluatorSessionController");

const { commentToDescription } = require('../Controllers/commentToDescriptionController');

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const CommentToDescription = require('../models/commentToDescription.model');

//comment on post '-'
router.post("/comment_on_post", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId, id } = req.body;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        content: { text: content, urls: urls },
        commentOn: [ "post", id ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and post documents
            const evaluatorId = await getEvaluatorIdBySessionId(sessionId);

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            comment._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "comment",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            evaluator.rate,
                        ],
                        submittedRate: evaluator.rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ]
                    });
        
                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            evaluator.comments.push(comment._id);
                            evaluator.ratedComments.push(comment._id);
                            evaluator.rateHistory.push(rateHistory._id)

                            evaluator.save()
                                .then(() => {
                                    
                                    Post.findByIdAndUpdate(id, {
                                        $push: { comments: comment._id }
                                    }, {
                                        "useFindAndModify": false
                                    })
                                    .then(() => {
                                        //update some fields (rate, rateNumber, userName and userId) of the comment
                                        //the automatic rate will be equal to the commenter user's rate
                                        
                                        comment.rate = evaluator.rate;
                                        comment.rateNumber = 1;
                                        comment.userProfilePictureUrl = evaluator.profilePictureUrl;
                                        comment.userName = evaluator.name;
                                        comment.userUsername = evaluator.username;
                                        comment.userId = evaluator._id;
                                        comment.rateHistory.push(rateHistory._id);

                                        comment.save()
                                            .then(updatedComment => res.json(updatedComment))
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
        .catch(err => res.status(400).json('Error: ' + err));

})

//comment on segredinho post '-'
router.post("/comment_on_segredinho", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId, id } = req.body;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        content: { text: content, urls: urls },
        commentOn: [ "segredinho", id ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and post documents
            const evaluatorId = await getEvaluatorIdBySessionId(sessionId);

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            comment._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "comment",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            evaluator.rate,
                        ],
                        submittedRate: evaluator.rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ]
                    });
        
                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            evaluator.comments.push(comment._id);
                            evaluator.ratedComments.push(comment._id);
                            evaluator.rateHistory.push(rateHistory._id)

                            evaluator.save()
                                .then(() => {
                                    
                                    Segredinho.findByIdAndUpdate(id, {
                                        $push: { comments: comment._id }
                                    }, {
                                        "useFindAndModify": false
                                    })
                                    .then(() => {
                                        //update some fields (rate, rateNumber, userName and userId) of the comment
                                        //the automatic rate will be equal to the commenter user's rate
                                        
                                        comment.rate = evaluator.rate;
                                        comment.rateNumber = 1;
                                        comment.userProfilePictureUrl = evaluator.profilePictureUrl;
                                        comment.userName = evaluator.name;
                                        comment.userUsername = evaluator.username;
                                        comment.userId = evaluator._id;
                                        comment.rateHistory.push(rateHistory._id);

                                        comment.save()
                                            .then(updatedComment => res.json(updatedComment))
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
        .catch(err => res.status(400).json('Error: ' + err));

})

//comment on queima '-'
router.post("/comment_on_queima", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId, id } = req.body;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        content: { text: content, urls: urls },
        commentOn: [ "queima", id ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and post documents
            const evaluatorId = await getEvaluatorIdBySessionId(sessionId);

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            comment._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "comment",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            evaluator.rate,
                        ],
                        submittedRate: evaluator.rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ]
                    });
        
                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            evaluator.comments.push(comment._id);
                            evaluator.ratedComments.push(comment._id);
                            evaluator.rateHistory.push(rateHistory._id)

                            evaluator.save()
                                .then(() => {
                                    
                                    Queima.findByIdAndUpdate(id, {
                                        $push: { comments: comment._id }
                                    }, {
                                        "useFindAndModify": false
                                    })
                                    .then(() => {
                                        //update some fields (rate, rateNumber, userName and userId) of the comment
                                        //the automatic rate will be equal to the commenter user's rate
                                        
                                        comment.rate = evaluator.rate;
                                        comment.rateNumber = 1;
                                        comment.userProfilePictureUrl = evaluator.profilePictureUrl;
                                        comment.userName = evaluator.name;
                                        comment.userUsername = evaluator.username;
                                        comment.userId = evaluator._id;
                                        comment.rateHistory.push(rateHistory._id);

                                        comment.save()
                                            .then(updatedComment => res.json(updatedComment))
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
        .catch(err => res.status(400).json('Error: ' + err));

})

//comment on belle '-'
router.post("/comment_on_belle", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId, id } = req.body;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        content: { text: content, urls: urls },
        commentOn: [ "belle", id ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and post documents
            const evaluatorId = await getEvaluatorIdBySessionId(sessionId);

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            comment._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "comment",
                        ],
                        evaluatorEvaluatedRateRelation: [
                            evaluator.rate,
                            evaluator.rate,
                        ],
                        submittedRate: evaluator.rate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            1,
                        ]
                    });
        
                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            evaluator.comments.push(comment._id);
                            evaluator.ratedComments.push(comment._id);
                            evaluator.rateHistory.push(rateHistory._id)

                            evaluator.save()
                                .then(() => {
                                    
                                    Belle.findByIdAndUpdate(id, {
                                        $push: { comments: comment._id }
                                    }, {
                                        "useFindAndModify": false
                                    })
                                    .then(() => {
                                        //update some fields (rate, rateNumber, userName and userId) of the comment
                                        //the automatic rate will be equal to the commenter user's rate
                                        
                                        comment.rate = evaluator.rate;
                                        comment.rateNumber = 1;
                                        comment.userProfilePictureUrl = evaluator.profilePictureUrl;
                                        comment.userName = evaluator.name;
                                        comment.userUsername = evaluator.username;
                                        comment.userId = evaluator._id;
                                        comment.rateHistory.push(rateHistory._id);

                                        comment.save()
                                            .then(updatedComment => res.json(updatedComment))
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
        .catch(err => res.status(400).json('Error: ' + err));

})


module.exports = router;
