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
const { array } = require('./../config/multer');

//create post
router.post('/post', upload.array("files", 6), async (req, res) => {
    const { content, sessionId } = req.body;
    const evaluadorId = await getEvaluatorIdBySessionId(sessionId);
    
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
                                        
                                                    }

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

                    const eCurrentRate = Number(evaluator.rate);
                    const eCurrentRateNumber = Number(evaluator.rateNumber);

                    //calculates object's new rate
                    const submittedRate = Number(req.body.rate);

                    const postCurrentRate = Number(post.rate);
                    const postRateNumber = Number(post.rateNumber);

                    //g(x,y)= ((100)/(46050)ln(x)+(1)/(4472120) (y*10000000000)^((1)/(2))) (-1000)+100
                    const oWeight = ((100/46050) * Mathjs.log(postRateNumber) + 
                        (1/4472120) * Mathjs.pow((postCurrentRate * 10000000000),(1/2)))*(-1000) + 100 ;

                    //h(x,y) = (100)/(46050)ln(x)+(1)/(4472120) ((y - 0.5)*10000000000)^((1)/(2))
                    const eWeight = (100/46050) * Mathjs.log(eCurrentRateNumber) + 
                        (1/4472120) * Mathjs.pow(((eCurrentRate - 0.5) * 10000000000),(1/2));
                    
                    //finalWeight = eWeight * (oWeight/100)
                    const finalWeight = eWeight * (oWeight/100);

                    //newRate = (1*currentRate + finalWeight*submittedRate)/1+finalWeight
                    const newRate = (postCurrentRate + finalWeight * submittedRate ) / (1 + finalWeight);

                    if(newRate > 5) {
                        newRate = 5;
                    }
                    else if(newRate < 0) {
                        newRate = 0;
                    }

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
                            newRate,
                        ],
                        submittedRate: submittedRate,
                        evaluatorEvaluatedRateNumberRelation: [
                            evaluator.rateNumber,
                            postRateNumber + 1,
                        ]
                    });

                    newRateHistory.save()
                        .then(rateHistory => {
                            
                            post.rate = newRate;
                            post.rateNumber = postRateNumber + 1;
                            post.rateHistory.push(rateHistory._id);

                            post.save()
                                .then(updatedPost => {
                                    evaluator.ratedPosts.push(updatedPost._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json(updatedPost.rate))
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

//get all the posts from one user
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

//get one post by its id
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