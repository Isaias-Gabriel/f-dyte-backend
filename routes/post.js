const router = require('express').Router();
const Mathjs = require('mathjs');
const upload = require('./../config/multer');

const Evaluator = require('../models/evaluator.model');

const Post = require('../models/post.model');
const Segredinho = require('../models/segredinho.model');

const RateHistory = require('../models/rateHistory.model');

const Notification = require('../models/notification.model');

const { 
    evaluatorSessionController, getEvaluatorIdBySessionId, deleteSession
} = require("../Controllers/evaluatorSessionController");

const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

const { array } = require('./../config/multer');

//create post
router.post('/post', upload.array("files", 6), async (req, res) => {
    const { content, sessionId } = req.body;
    const evaluadorId = await getEvaluatorIdBySessionId(sessionId);

    console.log(req.files);
    console.log(req.body);
    
    //get files urls
    urls = [];
    const temp_files = req.files || [];
    temp_files.map(file => {
        urls.push(file.location)
    })

    const newPost = new Post({ content: {
        text: content,
        urls: urls,
    }});

    newPost.save()
        .then(post => {

            Evaluator.findById(evaluadorId)
                .then(evaluator => {

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            post._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "post",
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

                            evaluator.ratedPosts.push(post._id);
                            evaluator.rateHistory.push(rateHistory._id); 
                            evaluator.posts.push(post._id)
                                    
                            evaluator.save()
                                .then(() => {
                                    post.rateHistory.push(rateHistory._id);
                                    post.rate = evaluator.rate;
                                    post.rateNumber = 1;

                                    post.userName = evaluator.name;
                                    post.userId = evaluator._id;
                                    post.userUsername = evaluator.username;
                                    post.userProfilePictureUrl = evaluator.profilePictureUrl;

                                    post.save()
                                        .then(updatedPost => {

                                            const newNotification = new Notification({
                                                content: {
                                                    caption: evaluator.name + ' just posted something',
                                                    text: content,
                                                    url: urls[0],
                                                },
                                                userProfilePictureUrl: evaluator.profilePictureUrl,
                                                link: '/post/' + updatedPost._id,
                                                notificationRead: false,
                                            })
                                        
                                            newNotification.save()
                                                .then(notification => {
                                                    for(let follower of evaluator.followedBy) {
                                                        
                                                        Evaluator.findById(follower)
                                                            .then(evaluator => {
                                                                evaluator.notifications.unshift(notification._id)
                                        
                                                                evaluator.markModified('notifications')
                                        
                                                                evaluator.save()
                                                                    .then(() => {})
                                                                    .catch(err => res.status(400).json('Error: ' + err));
                                        
                                                            })
                                                            .catch(err => res.status(400).json('Error: ' + err));
                                        
                                                    }z

                                                    res.json({
                                                        post: updatedPost,
                                                        notification: notification,
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
        .catch(err => res.status(400).json('Error: ' + err));

});

//update post rate
router.route('/update_post_rate').post(async (req, res) => {

    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Post.findById(req.body.id)
        .then(post => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const evaluatorRate = Number(evaluator.rate);
                    const evaluatorRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.rate);

                    const evaluatedRate = Number(post.rate);
                    const evaluatedRateNumber = Number(post.rateNumber);

                    const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            post._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "post",
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
                            
                            post.rate = newRate;
                            post.rateNumber = evaluatedRateNumber + 1;
                            post.rateHistory.push(rateHistory._id);

                            post.save()
                                .then(updatedPost => {
                                    evaluator.ratedPosts.push(updatedPost._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json({
                                            rate: updatedPost.rate
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

//get all the posts from one user - need user logged in info
router.route('/get_all_posts').post(async(req, res) => {

    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => {

            Evaluator.find({
                username: req.body.username,
            })
                .then(([profile]) => {
                    
                    let ratedPosts = belongToBoth(evaluator.ratedPosts, profile.posts);
                    const ratedSegredinhos = belongToBoth(evaluator.ratedSegredinhos, profile.segredinhos);

                    Post.find({
                        userUsername: req.body.username,
                    }).sort({ createdAt: -1, })
                        .then(posts => {

                            Segredinho.find({
                                userUsername: req.body.username,
                            }).sort({ createdAt: -1, })
                                .then(segredinhos => {

                                    posts = posts.concat(segredinhos);

                                    posts = posts.sort(function(a, b){return b.date - a.date});
                                    ratedPosts = ratedPosts.concat(ratedSegredinhos);

                                    res.json({
                                        posts: posts,
                                        ratedPosts: ratedPosts,
                                    });
                                })

                            
                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                        
                })
                .catch(err => res.status(400).json('Error: ' + err));
                
        })
        .catch(err => res.status(400).json('Error: ' + err));

})


//get all the posts from one user - don't need user logged in info
router.route('/get_all_posts_no_user').post(async(req, res) => {

    Post.find({
        userUsername: req.body.username,
    },
        'id content userName userUsername userProfilePictureUrl rate rateNumber createdAt'
    ).sort({ createdAt: -1, }).limit(30)
        .then(posts => {

            Segredinho.find({
                userUsername: req.body.username,
            },
                'id content originalText userName userUsername userProfilePictureUrl rate rateNumber createdAt'
            ).sort({ createdAt: -1, })
                .then(segredinhos => {

                    posts = posts.concat(segredinhos);

                    posts = posts.sort(function(a, b){return b.createdAt - a.createdAt});

                    res.json({
                        posts: posts,
                    });
                })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})


//get one post by its id - user rated or not rated post
router.route('/get_post').post((req, res) => {
    Post.findById(req.body.id)
        .then(async (post) => {
            const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId)

            Evaluator.findById(evaluatorId)
                .then(evaluator => {
                    const postIsRated = evaluator.ratedPosts.includes(post._id);
                    
                    res.json({
                        post: post,
                        postIsRated: postIsRated,
                    })
                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get one post by its id - no user info needed
router.route('/get_post_no_user').post((req, res) => {
    Post.find({
        "_id": req.body.id,
    },
        'id content userName userUsername userProfilePictureUrl rate rateNumber'
    )
        .then(async (post) => {
                    
            res.json({
                post: post,
            })

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get last post from a user
router.route('/get_last_post_from_evaluator').post((req, res) => {
    Evaluator.findById(req.body.id)
        .then(evaluator => {
            if(evaluator.posts.length) {
                Post.findById(evaluator.posts.pop())
                    .then(post => {
                        res.json(post);
                    })
                    .catch(err => res.status(400).json('Error: ' + err));

            }

            else {
                res.json({})
            }
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

//delete a post
router.route('/delete_post').post((req, res) => {
    Post.findByIdAndDelete(req.body.id)
        .then(() => res.json())
        .catch(err => res.status(400).json('Error: ' + err));
})


module.exports = router;