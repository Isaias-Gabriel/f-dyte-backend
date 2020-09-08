const router = require('express').Router();
const path = require("path");
const Mathjs = require('mathjs');

const upload = require('./../config/multer');

const Evaluator = require('../models/evaluator.model');
const FdObject = require('../models/fdObject.model');

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

//comment on object '-'
router.post("/comment_on_object", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId, objectId, commentSection } = req.body;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        commentSection,
        content: { text: content, urls: urls },
        commentOn: [ "object", objectId ]
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and object documents
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
                                    
                                    FdObject.findByIdAndUpdate(objectId, {
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

//comment on comment '-'
router.post("/comment_on_comment", upload.array("files", 12), (req, res) => {
    //create a comment document and save it
    const { content, sessionId } = req.body;
    const commentId = req.body.commentId || req.body.id;

    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push("http://localhost:5000/files/" + file.filename)
    })

    const newComment = new Comment({
        content: { text: content, urls: urls },
        commentOn: [ "comment", commentId ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and object documents
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
                                    
                                    Comment.findByIdAndUpdate(commentId, {
                                        $push: { comments: comment._id }
                                    }, {
                                        "useFindAndModify": false
                                    })
                                    .then(commentedComment => {
                                        
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
                                            .then(updatedComment => {

                                                if(!(evaluator.username === commentedComment.userUsername)) {
                                                    const newNotification = new Notification({
                                                        content: {
                                                            caption: evaluator.name + ' replied your comment',
                                                            text: content,
                                                            url: urls[0],
                                                        },
                                                        userProfilePictureUrl: evaluator.profilePictureUrl,
                                                        link: '/comment/' + comment._id,
                                                        notificationRead: false,
                                                    })
                                                
                                                    newNotification.save()
                                                        .then(notification => {
    
                                                            Evaluator.findById(commentedComment.userId)
                                                                .then(commentedEvaluator => {
                                                                    
                                                                    commentedEvaluator.notifications.unshift(notification._id);
                                                                    commentedEvaluator.markModified('notifications');
    
                                                                    commentedEvaluator.save()
                                                                        .then(() => {
                                                                            res.json({
                                                                                comment: updatedComment,
                                                                                notification: notification,
                                                                                for: [ commentedEvaluator._id ],
                                                                            });
                                                                        })
                                                                        .catch(err => res.status(400).json('Error: ' + err));
    
                                                                })
                                                                .catch(err => res.status(400).json('Error: ' + err));
        
                                                        })
                                                        .catch(err => res.status(400).json('Error: ' + err));
                                                }
                                                
                                                else {
                                                    res.json({
                                                        comment: updatedComment,
                                                        notification: undefined,
                                                    });
                                                }

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
        .catch(err => res.status(400).json('Error: ' + err));

})

//reply a comment on the for you '-'
router.post("/reply_on_for_you_inner_comment", (req, res) => {
    //create a comment document and save it
    const { content, sessionId, replyedUserUsername, parentId } = req.body;

    const newComment = new Comment({
        content: { text: content },
        commentOn: [ "comment", parentId ],
    });

    newComment.save()
        .then(async comment => {
            //get the comment id and save it on the user and object documents
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
                                    
                                    Comment.findByIdAndUpdate(parentId, {
                                        $push: { comments: comment._id },
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
                                            .then(updatedComment => {

                                                if(!(evaluator.username === replyedUserUsername)) {
                                                    const newNotification = new Notification({
                                                        content: {
                                                            caption: evaluator.name + ' replied your comment',
                                                            text: content,
                                                        },
                                                        userProfilePictureUrl: evaluator.profilePictureUrl,
                                                        link: '/comment/' + comment._id,
                                                        notificationRead: false,
                                                    })
                                                
                                                    newNotification.save()
                                                        .then(notification => {
    
                                                            Evaluator.find({
                                                                username: replyedUserUsername,
                                                            })
                                                                .then(([ commentedEvaluator ]) => {
                                                                    
                                                                    commentedEvaluator.notifications.unshift(notification._id);
                                                                    commentedEvaluator.markModified('notifications');
    
                                                                    commentedEvaluator.save()
                                                                        .then(() => {
                                                                            res.json({
                                                                                comment: updatedComment,
                                                                                notification: notification,
                                                                                for: [ commentedEvaluator._id ],
                                                                            });
                                                                        })
                                                                        .catch(err => res.status(400).json('Error: ' + err));
    
                                                                })
                                                                .catch(err => res.status(400).json('Error: ' + err));
        
                                                        })
                                                        .catch(err => res.status(400).json('Error: ' + err));
                                                }
                                                
                                                else {
                                                    res.json({
                                                        comment: updatedComment,
                                                        notification: undefined,
                                                    });
                                                }

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
        .catch(err => res.status(400).json('Error: ' + err));

})

//update comment rate
router.route('/update_comment_rate').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Comment.findById(req.body.id)
        .then(comment => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const eCurrentRate = Number(evaluator.rate);
                    const eCurrentRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.rate);

                    const commentCurrentRate = Number(comment.rate);
                    const commentRateNumber = Number(comment.rateNumber);

                    //g(x,y)= ((100)/(46050)ln(x)+(1)/(4472120) (y*10000000000)^((1)/(2))) (-1000)+100
                    const cWeight = ((100/46050) * Mathjs.log(commentRateNumber) + 
                        (1/4472120) * Mathjs.pow((commentCurrentRate * 10000000000),(1/2)))*(-1000) + 100 ;

                    //h(x,y) = (100)/(46050)ln(x)+(1)/(4472120) ((y - 0.5)*10000000000)^((1)/(2))
                    const eWeight = (100/46050) * Mathjs.log(eCurrentRateNumber) + 
                        (1/4472120) * Mathjs.pow(((eCurrentRate - 0.5) * 10000000000),(1/2));
                    
                    //finalWeight = eWeight * (cWeight/100)
                    const finalWeight = eWeight * (cWeight/100);

                    //newRate = (1*currentRate + finalWeight*submittedRate)/1+finalWeight
                    const newRate = (commentCurrentRate + finalWeight * submittedRate ) / (1 + finalWeight);

                    if(newRate > 5) {
                        newRate = 5;
                    }
                    else if(newRate < 0) {
                        newRate = 0;
                    }

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
                            newRate,
                        ],
                        submittedRate: submittedRate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            commentRateNumber + 1,
                        ]
                    });

                    newRateHistory.save()
                        .then(rateHistory => {
                            comment.rate = newRate;
                            comment.rateNumber = commentRateNumber + 1;
                            comment.rateHistory.push(rateHistory._id);

                            comment.save()
                                .then(updatedComment => {
                                    evaluator.ratedComments.push(updatedComment._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json(updatedComment.rate))
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

//return comments from a certain object
router.route('/get_object_comments_by_section/:nickname&:commentSection').post((req, res) => {
    FdObject.find({ nickname: req.params.nickname })
        .then(async ([ object ]) => {
            const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

            Evaluator.findById(evaluatorId)
            .then(evaluator => {
                const ratedComments = belongToBoth(evaluator.ratedComments, object.comments);

                Comment.find({
                    _id: { $in: object.comments },
                    commentSection: req.params.commentSection,
                })
                    .then(comments => {
                        //comments = comments.sort(function(a, b){return b.rate.$numberDecimal - a.rate.$numberDecimal});
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});
    
                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            })
            .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain object
router.route('/get_object_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    FdObject.find({
        nickname: req.body.objectNickname || req.body.id,
    })
    .then(async ([ evaluatedObject ]) => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                
                RateHistory.find({
                    evaluatorEvaluatedRelation: [ evaluator._id, evaluatedObject._id ]
                })
                    .then(([ rateHistory ]) => {
                        let commentsSection = "common";

                        if(rateHistory !== undefined) {
                            const rate = Number(rateHistory.submittedRate);
                            if(rate === 0) {
                                commentsSection = "hater";
                            }
                            else if(rate === 5) {
                                commentsSection = "lover";
                            }
                        }
                        //find the comments on the object that the user rated
                        //basically the intersection between the evaluatedObject.comments and evaluator.ratedComments
                        const ratedComments = belongToBoth(evaluator.ratedComments, evaluatedObject.comments);

                        Comment.find({
                            _id: { $in: evaluatedObject.comments },
                            commentSection: commentsSection,
                        })
                            .then(comments => {
                                //sort by rateNumber (the more rated ones first)
                                comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                                res.json({
                                    comments: comments,
                                    commentsSection: commentsSection,
                                    ratedComments: ratedComments,
                                });
                            })
                            .catch(err => res.status(400).json('Error: ' + err));

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain post
router.route('/get_post_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    Post.findById({
        "_id": req.body.id
    })
    .then(async post => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //find the comments on the object that the user rated
                //basically the intersection between the post.comments and evaluator.ratedComments
                const ratedComments = belongToBoth(evaluator.ratedComments, post.comments);

                Comment.find({
                    _id: { $in: post.comments },
                })
                    .then(comments => {
                        //sort by rateNumber (the more rated ones first)
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain segredinho post
router.route('/get_segredinho_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    Segredinho.findById({
        "_id": req.body.id
    })
    .then(async segredinho => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //find the comments on the object that the user rated
                //basically the intersection between the segredinho.comments and evaluator.ratedComments
                const ratedComments = belongToBoth(evaluator.ratedComments, segredinho.comments);

                Comment.find({
                    _id: { $in: segredinho.comments },
                })
                    .then(comments => {
                        //sort by rateNumber (the more rated ones first)
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain queima
router.route('/get_queima_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    Queima.findById({
        "_id": req.body.id
    })
    .then(async queima => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //find the comments on the object that the user rated
                //basically the intersection between the post.comments and evaluator.ratedComments
                const ratedComments = belongToBoth(evaluator.ratedComments, queima.comments);

                Comment.find({
                    _id: { $in: queima.comments },
                })
                    .then(comments => {
                        //sort by rateNumber (the more rated ones first)
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain belle
router.route('/get_belle_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    Belle.findById({
        "_id": req.body.id
    })
    .then(async belle => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //find the comments on the object that the user rated
                //basically the intersection between the post.comments and evaluator.ratedComments
                const ratedComments = belongToBoth(evaluator.ratedComments, belle.comments);

                Comment.find({
                    "_id": { $in: belle.comments },
                })
                    .then(comments => {
                        //sort by rateNumber (the more rated ones first)
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return comments from a certain comment hseuheuehu
router.route('/get_comment_comments').post((req, res) => {

    //get the comments by comment section according to the object and the user
    Comment.findById({
        "_id": req.body.commentId || req.body.id,
    })
    .then(async comment => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //find the comments on the object that the user rated
                //basically the intersection between the comment.comments and evaluator.ratedComments
                const ratedComments = belongToBoth(evaluator.ratedComments, comment.comments);

                Comment.find({
                    _id: { $in: comment.comments },
                })
                    .then(comments => {
                        //sort by rateNumber (the more rated ones first)
                        comments = comments.sort(function(a, b){return b.rateNumber - a.rateNumber});

                        res.json({
                            comments: comments,
                            ratedComments: ratedComments,
                        });
                    })
                    .catch(err => res.status(400).json('Error: ' + err));
                
            })
            .catch(err => res.status(400).json('Error: ' + err));
            
    })
    .catch(err => res.status(400).json('Error: ' + err));

})

//return if a comment can become a description or not
//and if so, in which spot
router.route('/comment_can_become_description').post(async (req, res) => {
    const { objectId, objectRateNumber, commentId,
        commentOnSpot1Id, commentOnSpot2Id, commentOnSpot3Id,
        rateInfo, } = req.body;

    const response = await commentToDescription(
        objectId, objectRateNumber, commentId,
        commentOnSpot1Id, commentOnSpot2Id, commentOnSpot3Id,
        rateInfo,
    );

    res.json(response);
    
})

function sendNotificationWhenCommentUpdateObject(notification1Id, notification2Id, for1, for2) {
    //send the notification for those who are following the object
    Evaluator.find({
        '_id': { $in: for1 }
    })
        .then(evaluators => {
            for(let ev of evaluators) {
                ev.notifications.unshift(notification1Id);
                ev.markModified('notifications');

                ev.save();
            }
        })
        .catch(err => res.status(400).json('Error: ' + err));

    Evaluator.findById(for2[0])
        .then(evaluator => {
            evaluator.notifications.unshift(notification2Id);
            evaluator.markModified('notifications');

            evaluator.save();
        })
        .catch(err => res.status(400).json('Error: ' + err));

}

router.route('/update_object_with_comment_content').post((req, res) => {
    Comment.findById(req.body.commentId)
        .then(comment => {

            FdObject.findById(req.body.objectId)
                .then(object => {

                    let text, url;
                    //update the object fields according to the non empty comment fields
                    if(comment.content.text.length) {
                        text = comment.content.text;
                        object.description[1][req.body.spot - 1] = [ comment.content.text, comment.userUsername, comment._id ];

                        object.markModified('description');
                    }

                    //if there's an image or video on the comment, add in the beginning of the media section,
                    //regardless of the comment's spot 
                    //if there's more than five media files, remove the last one
                    if(comment.content.urls.length) {
                        url = comment.content.urls[0];
                        const urlsNumber = object.urls[1].unshift([ comment.content.urls[0], comment.userUsername ]);
                        if(urlsNumber > 5) {
                            object.urls[1].pop();
                        }

                        object.markModified('urls');
                    }

                    object.save()
                        .then(updatedObject => {
                            const newNotification1 = new Notification({
                                content: {
                                    caption: 'A comment by ' + comment.userUsername + ' updated the object ' + updatedObject.name,
                                    text: text,
                                    url: url,
                                },
                                userProfilePictureUrl: comment.userProfilePictureUrl,
                                link: '/object/' + updatedObject.nickname,
                                notificationRead: false,
                            })

                            const newNotification2 = new Notification({
                                content: {
                                    caption: 'Your comment updated the object ' + updatedObject.name,
                                    text: text,
                                    url: url,
                                },
                                userProfilePictureUrl: comment.userProfilePictureUrl,
                                link: '/object/' + updatedObject.nickname,
                                notificationRead: false,
                            })

                            newNotification1.save()
                                .then(notification1 => {

                                    newNotification2.save()
                                        .then(notification2 => {

                                            sendNotificationWhenCommentUpdateObject(notification1._id,
                                                notification2._id, updatedObject.followedBy, [ comment.userId ]);

                                            res.json({
                                                object: updatedObject,
                                                notification1: notification1,
                                                notification2: notification2,
                                                for1: updatedObject.followedBy,
                                                for2: [ comment.userId ],
                                            });

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

//return comment by its id and the objects in which the comment is
router.route('/get_comment_complete_info').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);
    
    Evaluator.findById(evaluatorId)
        .then(evaluator => {
            
            //get the comments by comment section according to the object and the user
            Comment.findById({
                "_id": req.body.id
            })
            .then(async mainComment => {

                const toReturn = [];
                let isRated;

                isRated = evaluator.ratedComments.includes(mainComment._id);

                toReturn.unshift([ mainComment, isRated ]);

                let canContinue;

                if(mainComment.commentOn[0] === "comment") {
                    canContinue = true;
                }
                
                //if mainComment is in a comment, it will get the comments it's in, til the comments which's not in a comment
                while(canContinue) {
                    const comment = await Comment.findById(toReturn[0][0].commentOn[1]);
                    
                    if(!(comment)) {
                        res.json(undefined);
                    }

                    else {
                        isRated = evaluator.ratedComments.includes(comment._id);
                        
                        toReturn.unshift([ comment, isRated ]);
                        if(comment.commentOn[0] === "comment") {
                            canContinue = true;
                        }
                        else {
                            canContinue = false;
                        }
                    }

                }

                const auxObject = {
                    object: FdObject,
                    post: Post,
                    queima: Queima,
                    segredinho: Segredinho,
                    belle: Belle,
                }
                
                const commentOn = toReturn[0][0].commentOn;

                auxObject[commentOn[0]].findById(commentOn[1])
                    .then(opqb => {
                        console.log(typeof opqb)
                        //will return a string in the form rated + Model + s
                        const field = "rated" + 
                            commentOn[0][0].toUpperCase() + 
                            commentOn[0].substring(1,13) + "s";
                        
                        isRated = evaluator[field].includes(opqb._id);
                        
                        toReturn.unshift([ commentOn[0], opqb, isRated ]);

                        //console.log(toReturn);

                        res.json(toReturn);
                    })
                    .catch(err => console.log(err));
                    
            })
            .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//delete a comment
router.route('/delete_comment').post((req, res) => {
    Comment.findByIdAndDelete(req.body.id)
        .then(returned => {
            //take off that comment id on the resource it was made on and on the user who made it
            // Evaluator.find({
            //     'comments': returned._id,
            // })
            //     .then(([evaluator]) => {
            //         console.log(evaluator.comments.)
            //         evaluator.comments 
            //     })
            // console.log(returned);
            res.json({});
        })
        .catch(err => res.status(400).json('Error: ' + err));
})

//delete a comment
router.route('/create_accessory_document').get((req, res) => {
    // const newDoc = new CommentToDescription({
    //     objects: {
    //         objectId: {
    //             commentId: [ Date.now() ],
    //         }
    //     },
    // });

    CommentToDescription.find({

    }, //{ date: 1 }
    )
        .then(docs => {
            // nDoc.updateOne(
            //     { 'objects.5f0735c03d36db39bc9121e05f1c6ade05c16c0dccfd403f': [ 1598100983020 ] },
            //     //{ $set: { name: 'Aaakash'}},
            //     {upsert:true})
                
            res.json(docs);
        })
        .catch(err => console.log(err));
})


module.exports = router;
