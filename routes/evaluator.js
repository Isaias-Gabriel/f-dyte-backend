const router = require('express').Router();
const Mathjs = require('mathjs');
const recommend = require('collaborative-filter');

let nodemailer = require('nodemailer');
let aws = require('aws-sdk');

const upload = require('./../config/multer');

const ObjectModel = require('../models/fdObject.model');

const Evaluator = require('../models/evaluator.model');

const Post = require('../models/post.model');
const Segredinho = require('../models/segredinho.model');
const Queima = require('../models/queima.model');
const Belle = require('../models/belle.model');

const Comment = require('../models/comment.model');

const Notification = require('../models/notification.model');

const RateHistory = require('../models/rateHistory.model');

const { evaluatorSessionController, getEvaluatorIdBySessionId, deleteSession } = require("../Controllers/evaluatorSessionController");

const canRateAgain = require('../AuxiliaryFunctions/canRateAgain');
const belongToBoth = require('../AuxiliaryFunctions/belongToBoth');
const calculateRate = require('../AuxiliaryFunctions/calculateRate');

const { hash, compare } = require('../AuxiliaryFunctions/fDyteHash');
const FdObject = require('../models/fdObject.model');

require('dotenv').config();

//fix security issues later on

//send an email with random numbers for the user confirm its email ownership
router.route('/confirm_email').post(async (req, res) => {
    const { email, language } = req.body;

    const staticText = {
        'pt-BR': {
            subject: 'f Dyte - confirmação de e-mail',

            header: 'Confirme seu e-mail',
            paragraphs: [
                'Você acabou de criar sua conta no f Dyte ^^',
                'Voce pode precisar deste código para verificar seu e-mail:',
            ],
            lowerMessage: "Se você não criou uma conta no f Dyte, ignore este e-mail '-'",
        },
        'en-US': {
            subject: 'f Dyte - email confirmation',

            header: 'Confirm your email',
            paragraphs: [
                'You just signed up on f Dyte ^^',
                'You may need this code to verify your email:',
            ],
            lowerMessage: "If you haven't sign up on f Dyte, ignore this email '-'",
        },
    }

    const styles = {
        outterDiv: 'border:solid 1px rgb(253,253,253);padding:calc(1px + 4vw);' +
            'display:flex;flex-direction:column;align-items:center;' +
            'background:rgb(253,253,253);' +
            'background:linear-gradient(170deg,rgb(245, 240, 252) 0%,rgb(255, 246, 245) 9%,rgb(255, 252, 245) 30%,rgb(255, 255, 255) 100%);',
        verificationNumberDiv: 'width:calc(5px + 13vw);height:calc(3px + 9vh);' +
            'background:rgb(253,253,253);display:flex;align-items:center;justify-content:center;' +
            'background:linear-gradient(170deg,rgba(235, 232, 235, 0.589) 0%,rgb(236, 235, 235) 9%,rgba(230, 229, 227, 0.596) 30%,rgb(255, 255, 255) 100%);',
    }

    let confirmationCode = '';

    for(let i = 0; i < 6; i++) {
        let aux = Math.random();
        aux = Math.round(aux * 10);
        confirmationCode += aux.toString();
    }

    aws.config.loadFromPath('config.json');

    // Set the region
    aws.config.update({region: 'us-east-2'});

    const body_html = `<html>
        <head></head>
        <body>
            <div style=${styles.outterDiv}>
                <h1>
                    ${
                        (staticText[language]) ? staticText[language].header : staticText['en-US'].header
                    }
                </h1>
                <div>
                    <p>
                        ${
                            (staticText[language]) ? staticText[language].paragraphs[0] : staticText['en-US'].paragraphs[0]
                        }
                    </p>

                    <p>
                        ${
                            (staticText[language]) ? staticText[language].paragraphs[1] : staticText['en-US'].paragraphs[1]
                        }
                    </p>
                    <div>
                        <div style=${styles.verificationNumberDiv}>`
                            + confirmationCode +
                        `</div>
                    </div>
                </div>

                <div>
                    <p>
                        ${
                            (staticText[language]) ? staticText[language].lowerMessage : staticText['en-US'].lowerMessage
                        }
                    </p>
                </div>
            </div>
        </body>
        </html>`;

    const subject = (staticText[language]) ? staticText[language].subject : staticText['en-US'].subject;

    // The email body for recipients with non-HTML email clients.
    const body_text = `${ (staticText[language]) ? staticText[language].header : staticText['en-US'].header }\r\n`
            + `${ (staticText[language]) ? staticText[language].paragraphs[0] : staticText['en-US'].paragraphs[0] }\r\n`
            + `${ (staticText[language]) ? staticText[language].paragraphs[1] : staticText['en-US'].paragraphs[1] }\r\n`
            + confirmationCode + `\r\n\r\n\r\n`
            + `${ (staticText[language]) ? staticText[language].lowerMessage : staticText['en-US'].lowerMessage }`;

    // Create sendEmail params 
    let params = {
        Destination: { /* required */
            CcAddresses: [
            'noreply@fdyte.com',
            /* more items */
            ],
            ToAddresses: [
                email,
            /* more items */
            ]
        },
        Message: { /* required */
            Body: { /* required */
                Html: {
                    Charset: "UTF-8",
                    Data: body_html,
                },
                Text: {
                    Charset: "UTF-8",
                    Data: body_text
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: 'noreply@fdyte.com', /* required */
        ReplyToAddresses: [
            'noreply@fdyte.com',
            /* more items */
        ],
    };

    // Create the promise and SES service object
    let sendPromise = new aws.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise.then(
        function(data) {
            console.log('email sent - email id: ' + data.MessageId);
        }
    ).catch(
        function(err) {
            console.error(err, err.stack);
        }
    );
    res.json({
        confirmationCode: confirmationCode,
    });
});

//sign up
//create evaluator
router.route('/sign_up').post(async (req, res) => {
    //set a default name and profile image
    const { email, username, rate } = req.body;
    const rateNumber = 1;
    const name = "user I";
    const profilePictureUrl = process.env.AWS_BUCKET_URL + "defaultEvaluatorProfilePicture.png";
        
    const password = hash(req.body.password);

    const newEvaluator = new Evaluator({ email, password, name, username, profilePictureUrl, rate, rateNumber });

    newEvaluator.save()
        .then(async evaluator => {
            const sessionId = hash(Date.now().toString() + evaluator._id);

            evaluatorSessionController(sessionId, evaluator._id);

            const newRateHistory = new RateHistory({
                evaluatorEvaluatedRelation: [
                    evaluator._id,
                    evaluator._id,
                ],
                evaluatorEvaluatedTypesRelation: [
                    "evaluator",
                    "evaluator",
                ],
                evaluatorEvaluatedRateRelation: [
                    evaluator.rate,
                    evaluator.rate,
                ],
                submittedRate: evaluator.rate,
                evaluatorEvaluatedRateNumberRelation: [
                    1,
                    1,
                ],
            });
        
            newRateHistory.save()
                .then(rateHistory => {
                    evaluator.ratedEvaluators.push(evaluator._id);
                    evaluator.rateHistory.push(rateHistory._id);
            
                    evaluator.save()
                        .then(() => res.json({sessionId: sessionId}))
                        .catch(err => res.status(400).json('Error: ' + err));

                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));
        
});

//log in
router.route('/log_in').post(async (req, res) => {
    const { email, password } = req.body;
    let username = undefined;
    if(!(email.includes("@"))) {
        username = email;
    }

    //enter by username
    if(username) {
        //enter by email
        Evaluator.find({username: username})
            .then(([ evaluator ]) => {

            if(evaluator === undefined) {
                res.json("Usuário não encontrado")
            }

            else {
                //bcrypt.compare(req.body.password, evaluator.password).then(async (result) => {
                    //if(result) {
                    if(compare(evaluator.password, password)) {
                        //generate a session id
                        //const sessionId = await bcrypt.hash(evaluator._id.toString(), 10);
                        const sessionId = hash(Date.now().toString() + evaluator._id);
                        //verify if the id is already in use

                        evaluatorSessionController(sessionId, evaluator._id);

                        res.json({
                            sessionId: sessionId,
                            username: evaluator.username
                        });
                    }
                    else {
                        res.json("Senha incorreta.");
                    }
                //});
            }
        })
    }

    //enter by email
    else {
        Evaluator.find({email: email})
            .then(([ evaluator ]) => {

            if(evaluator === undefined) {
                res.json("Usuário não encontrado")
            }

            else {
                // bcrypt.compare(req.body.password, evaluator.password).then(async (result) => {
                //     if(result) {
                    if(evaluator.password === password) {
                        //generate a session id
                        //const sessionId = await bcrypt.hash(evaluator._id.toString(), 10);
                        const sessionId = password + password;
                        //verify if the id is already in use

                        evaluatorSessionController(sessionId, evaluator._id);

                        res.json({
                            sessionId: sessionId,
                            username: evaluator.username
                        });
                    }
                    else {
                        res.json("Senha incorreta.");
                    }
                //});
            }
        })
    }
})

//log out
router.route('/log_out').post(async (req, res) => {
    deleteSession(req.body.sessionId)

    res.json({});
})

//update user's rate
router.route('/update_user_rate').post(async (req, res) => {

    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(req.body.evaluatedId || req.body.id)
        .then(evaluated => {

            Evaluator.findById(evaluatorId)
                .then(evaluator => {

                    const evaluatorRate = Number(evaluator.rate);
                    const evaluatorRateNumber = Number(evaluator.rateNumber);

                    const submittedRate = Number(req.body.rateToSubmit || req.body.rate);

                    const evaluatedRate = Number(evaluated.rate);
                    const evaluatedRateNumber = Number(evaluated.rateNumber);

                    const newRate = calculateRate(evaluatorRate, evaluatedRate, evaluatorRateNumber, evaluatedRateNumber, submittedRate);

                    const newRateHistory = new RateHistory({
                        evaluatorEvaluatedRelation: [
                            evaluator._id,
                            evaluated._id,
                        ],
                        evaluatorEvaluatedTypesRelation: [
                            "evaluator",
                            "evaluator",
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

                            evaluated.rate = newRate;
                            evaluated.rateNumber = evaluatedRateNumber + 1;
                            evaluated.rateHistory.push(rateHistory._id);

                            evaluated.save()
                                .then(updatedEvaluator => {

                                    evaluator.ratedEvaluators.push(updatedEvaluator._id);
                                    evaluator.rateHistory.push(rateHistory._id);

                                    evaluator.save()
                                        .then(() => res.json({
                                            rate: updatedEvaluator.rate,
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

// if(profilePictureUrl) {
//     evaluator.profilePictureUrl = profilePictureUrl;
// }

// if(profileBackgroundImageUrl) {
//     evaluator.profileBackgroundImageUrl = profileBackgroundImageUrl;
// }

//will update the evaluator info in its comments, posts, queimas and belles
function updateEvaluatorTrack(name, username, evaluator) {
    //will update only the fields (name and username) that changed
    if(name && username) {
        //update info on evaluator's comments
        Comment.find({
            "_id": { $in: evaluator.comments }
        })
            .then(comments => {

                for(let comment of comments) {
                    comment.userName = name;
                    comment.userUsername = username;

                    comment.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Post.find({
            "_id": { $in: evaluator.posts }
        })
            .then(posts => {
                    
                for(let post of posts) {
                    post.userName = name;
                    post.userUsername = username;

                    post.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Queima.find({
            "_id": { $in: evaluator.queimas }
        })
            .then(queimas => {
                    
                for(let queima of queimas) {
                    queima.userName = name;
                    queima.userUsername = username;

                    queima.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Belle.find({
            "_id": { $in: evaluator.belles }
        })
            .then(belles => {
                    
                for(let belle of belles) {
                    belle.userName = name;
                    belle.userUsername = username;

                    belle.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));
        
    }

    else if(name) {
        //update evaluator's comments
        Comment.find({
            "_id": { $in: evaluator.comments }
        })
            .then(comments => {
                
                for(let comment of comments) {
                    comment.userName = name;

                    comment.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Post.find({
            "_id": { $in: evaluator.posts }
        })
            .then(posts => {
                    
                for(let post of posts) {
                    post.userName = name;

                    post.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Queima.find({
            "_id": { $in: evaluator.queimas }
        })
            .then(queimas => {
                    
                for(let queima of queimas) {
                    queima.userName = name;

                    queima.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Belle.find({
            "_id": { $in: evaluator.belles }
        })
            .then(belles => {
                    
                for(let belle of belles) {
                    belle.userName = name;

                    belle.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

    }
    
    else if(username) {
        //update evaluator's comments
        Comment.find({
            "_id": { $in: evaluator.comments }
        })
            .then(comments => {
                
                for(let comment of comments) {
                    comment.userUsername = username;

                    comment.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Post.find({
            "_id": { $in: evaluator.posts }
        })
            .then(posts => {
                    
                for(let post of posts) {
                    post.userUsername = username;

                    post.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Queima.find({
            "_id": { $in: evaluator.queimas }
        })
            .then(queimas => {
                    
                for(let queima of queimas) {
                    queima.userUsername = username;

                    queima.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

        Belle.find({
            "_id": { $in: evaluator.belles }
        })
            .then(belles => {
                    
                for(let belle of belles) {
                    belle.userUsername = username;

                    belle.save()
                        .then(() => {

                        })
                        .catch(err => res.status(400).json('Error: ' + err));
                }

            })
            .catch(err => res.status(400).json('Error: ' + err));

    }

}

//update evaluator info
router.post('/update_evaluator_info', async (req, res) => {
    const { name, username, email } = req.body;

    Evaluator.find({
        username: req.body.originalUsername
    })
        .then(([ evaluator ]) => {

            if(name) {
                evaluator.name = name;
            }

            if(username) {
                evaluator.username = username;
            }

            if(email) {
                evaluator.email = email;
            }

            evaluator.save()
                .then(updatedEvaluator => {
                    if(name || username) {
                        updateEvaluatorTrack(name, username, updatedEvaluator);
                    }

                    res.json(updatedEvaluator)
                })
                .catch(err => res.status(400).json('Error: ' + err));
            
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

router.route('/add_follower_to_evaluator').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.find({
        username: req.body.username,
    }, 'id username followedBy')
        .then(([ followed ]) => {

            Evaluator.find({
                _id: evaluatorId,
            }, 'id username followedEvaluators followedBy')
                .then(([follower]) => {
                    
                    //if the follower is different from the followed
                    if(!(followed._id.toString() === follower._id.toString())) {
                        follower.followedEvaluators.unshift(followed._id);
                        followed.followedBy.unshift(follower._id);

                        follower.markModified('followedEvaluators');
                        followed.markModified('followedBy');
                        
                        follower.save()
                            .then(() => {
                                followed.save()
                                    .then(updatedFollowed => {
                                        res.json(updatedFollowed.username);
                                    })
                                    .catch(err => res.status(400).json('Error: ' + err));
                            })
                            .catch(err => res.status(400).json('Error: ' + err));
                    }

                    else {
                        follower.followedEvaluators.unshift(follower._id);
                        follower.followedBy.unshift(follower._id);

                        follower.markModified('followedEvaluators');
                        follower.markModified('followedBy');
                        
                        follower.save()
                            .then(updatedFollowed => {
                                res.json(updatedFollowed.username);
                            })
                            .catch(err => res.status(400).json('Error: ' + err));
                    }

                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

router.route('/remove_follower_from_evaluator').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.find({
        username: req.body.username,
    }, 'id username followedBy')
        .then(([ followed ]) => {

            Evaluator.find({
                _id: evaluatorId,
            }, 'id username followedEvaluators followedBy')
                .then(([follower]) => {
                    
                    if(!(followed._id.toString() === follower._id.toString())) {

                        let tempFollowedEvaluators = follower.followedEvaluators.filter(ev => ev.toString() !== follower._id.toString());

                        let tempFollowedBy = followed.followedBy.filter(ev => ev.toString() !== follower._id.toString());

                        follower.followedEvaluators = tempFollowedEvaluators;
                        followed.followedBy = tempFollowedBy;

                        follower.markModified('followedEvaluators');
                        followed.markModified('followedBy');
                        
                        follower.save()
                            .then(() => {
                                followed.save()
                                    .then(updatedFollowed => {
                                        console.log(updatedFollowed)
                                        res.json(updatedFollowed.username);
                                    })
                                    .catch(err => res.status(400).json('Error: ' + err));
                            })
                            .catch(err => res.status(400).json('Error: ' + err));
                    }

                    else {
                        let tempFollowedEvaluators = follower.followedEvaluators.filter(ev => ev.toString() !== follower._id.toString());

                        let tempFollowedBy = follower.followedBy.filter(ev => ev.toString() !== follower._id.toString());

                        follower.followedEvaluators = tempFollowedEvaluators;
                        follower.followedBy = tempFollowedBy;

                        follower.markModified('followedEvaluators');
                        follower.markModified('followedBy');
                        
                        follower.save()
                            .then(updatedFollowed => {
                                res.json(updatedFollowed.username);
                            })
                            .catch(err => res.status(400).json('Error: ' + err));
                    }

                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//will update the evaluator profile picture url in its comments, posts, queimas and belles
function updateEvaluatorProfilePictureTrack(url, evaluator) {
    
    Comment.find({
        "_id": { $in: evaluator.comments }
    })
        .then(comments => {

            for(let comment of comments) {
                comment.userProfilePictureUrl = url;

                comment.save()
                    .then(() => {

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            }

        })
        .catch(err => res.status(400).json('Error: ' + err));

    Post.find({
        "_id": { $in: evaluator.posts }
    })
        .then(posts => {
                
            for(let post of posts) {
                post.userProfilePictureUrl = url;

                post.save()
                    .then(() => {

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            }

        })
        .catch(err => res.status(400).json('Error: ' + err));

    Queima.find({
        "_id": { $in: evaluator.queimas }
    })
        .then(queimas => {
                
            for(let queima of queimas) {
                queima.userProfilePictureUrl = url;

                queima.save()
                    .then(() => {

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            }

        })
        .catch(err => res.status(400).json('Error: ' + err));

    Belle.find({
        "_id": { $in: evaluator.belles }
    })
        .then(belles => {
                
            for(let belle of belles) {
                belle.userProfilePictureUrl = url;

                belle.save()
                    .then(() => {

                    })
                    .catch(err => res.status(400).json('Error: ' + err));
            }

        })
        .catch(err => res.status(400).json('Error: ' + err));

}

//update evaluator profile picture
router.post("/update_evaluator_profile_picture", upload.array("files", 1), async (req, res) => {
    const profilePictureUrl = req.files[0].location;

    Evaluator.find({
        username: req.body.originalUsername
    })
        .then(([ evaluator ]) => {
            
            evaluator.profilePictureUrl = profilePictureUrl;

            evaluator.save()
                .then(updatedEvaluator => {
                    
                    updateEvaluatorProfilePictureTrack(profilePictureUrl, updatedEvaluator);

                    res.json(profilePictureUrl)
                })
                .catch(err => res.status(400).json('Error: ' + err));
            
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//userProfileBackgroundImageUrl: String,

//get complete user info by username
router.route('/complete_evaluator_info/:username').get(async (req, res) => {
    Evaluator.find({
        username: req.params.username
    },
        'id name username profilePictureUrl rate rateNumber createdAt followedBy'
    )
        .then(([ temp_evaluator ]) => {
            const evaluator = {
                _id: temp_evaluator._id,
                name: temp_evaluator.name,
                username: temp_evaluator.username,
                profilePictureUrl: temp_evaluator.profilePictureUrl,
                rate: temp_evaluator.rate,
                rateNumber: temp_evaluator.rateNumber,
                createdAt: temp_evaluator.createdAt,
            }
            res.json({
                evaluator: evaluator,
                followersNumber: temp_evaluator.followedBy.length,
            })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get complete user info by session id
router.route('/complete_evaluator_info_by_session_id').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(evaluatorId)
        .then(evaluator => res.json(evaluator))
        .catch(err => res.status(400).json('Error: ' + err));

})

//get user username by session id
router.route('/evaluator_username').post(async (req, res) => {
    const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);
    
    Evaluator.findById(evaluatorId)
        .then(evaluator => res.json(evaluator.username))
        .catch(err => res.status(400).json('Error: ' + err));

})

//tells if a username is already being used
router.route('/evaluator_username_in_use').post(async (req, res) => {
    Evaluator.find({
        username: req.body.username
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

//tells if an email is already being used
router.route('/email_in_use').post(async (req, res) => {
    Evaluator.find({
        email: req.body.email
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

//tells if a user can rate some other user or not
router.route('/user_can_rate_or_follow_user').post(async (req, res) => {
    Evaluator.find({
        username: req.body.profileUsername
    })
    .then(async ([ evaluated ]) => {
        
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);

        Evaluator.findById(evaluatorId)
            .then(evaluator => {
                //if the evaluated id is in the ratedEvaluators array, it will return true, 
                //which means the user can't rate that evaluator
                let canBeRated = !(evaluator.ratedEvaluators.includes(evaluated._id));

                RateHistory.find({
                    evaluatorEvaluatedRelation: [ evaluator._id, evaluated._id ]
                }).sort({ createdAt: -1, })
                    .then(rateHistories => {

                        const isFollowed = evaluated.followedBy.includes(evaluator._id);
                            
                        const rateHistory = rateHistories[0];
                        
                        //if the evaluator had already rated the object, checks if it can rate again according to the rerating rule
                        if(!(canBeRated)) {
                            //returning true means the user can rate the object again according to the rerating rules
                            canBeRated = canRateAgain(evaluated.rateNumber, rateHistory.evaluatorEvaluatedRateNumberRelation[1]);

                            //then remove that object id from evaluators.ratedObjects array
                            if(canBeRated) {

                                Evaluator.findByIdAndUpdate(evaluator._id, {
                                    $pull: { ratedEvaluators: evaluated._id }
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

//return all the posts, segredinhos, queimas and belles from evaluators
router.route('/return_feed').post(async (req, res) => {
    const userId = await getEvaluatorIdBySessionId(req.body.sessionId);

    Evaluator.findById(userId)
        .then(evaluator => {
            
            Evaluator.find({
                '_id': { $in: evaluator.followedEvaluators }
            })
                .then(evaluators => {
                    let counter = 0, toReturn = [];

                    for(let currentEvaluator of evaluators) {
                        
                        console.log(currentEvaluator._id);
                        //get the posts, segredinhos, queimas and belles from each evaluator
                        Post.find({
                            '_id': { $in: currentEvaluator.posts }
                        }).sort({ createdAt: -1, }).limit(2)
                            .then(posts => {
                                Segredinho.find({
                                    '_id': { $in: currentEvaluator.segredinhos }
                                }).sort({ createdAt: -1, }).limit(2)
                                    .then(segredinhos => {
                                        Queima.find({
                                            '_id': { $in: currentEvaluator.queimas }
                                        }).sort({ createdAt: -1, }).limit(2)
                                            .then(queimas => {
                                                Belle.find({
                                                    '_id': { $in: currentEvaluator.belles }
                                                }).sort({ createdAt: -1, }).limit(2)
                                                    .then(belles => {
                                                        let toConcat;

                                                        toConcat = posts.concat(segredinhos);
                                                        toConcat = toConcat.concat(queimas.concat(belles));
                                                        toReturn = toReturn.concat(toConcat);

                                                        //console.log(toConcat.length);
                                                        //console.log(toReturn.length);

                                                        counter += 1;
                                                        res.json(counter);
                                                        //console.log(counter);
                                                        if(counter === evaluators.length) {
                                                            // toReturn = toReturn.sort(function(a, b){return b.date - a.date});
                                                            // res.json(toReturn);
                                                            return '';
                                                        }

                                                    })
                                                    .catch(err => {
                                                        
                                                        res.status(400).json('Error: ' + err);
                                                        return '';
                                                    });
                                            })
                                            .catch(err => {
                                                
                                                res.status(400).json('Error: ' + err);
                                                return '';
                                            });

                                    })
                                    .catch(err => {
                                        
                                        res.status(400).json('Error: ' + err);
                                        return '';
                                    });
                            })
                            .catch(err => {
                                
                                res.status(400).json('Error: ' + err);
                                return '';
                            });
                    }
                })
                .catch(err => res.status(400).json('Error: ' + err));

        })
        .catch(err => res.status(400).json('Error: ' + err));

})

function whatToSugest(documentType, documentId) {
    const auxObject = {
        object: ObjectModel,
        evaluator: Evaluator,
        post: Post,
        segredinho: Segredinho,
        queima: Queima,
        belle: Belle,
        comment: Comment,
    }

    auxObject[documentType].findById(documentId)
        .then(returnedDocument => {
            //get the evaluators that evaluated returnedDocument
            if(returnedDocument){
                let counter = 0;

                for(let rdrh of returnedDocument.rateHistory.reverse()) {
                    // const lastRdrh = returnedDocument.rateHistory
                    //     .reverse()[returnedDocument.rateHistory.reverse().length - 1];

                    // if(pol0 && (rdrh === lastRdrh)) {
                    //     pol1 = true;
                    // }
                    
                    RateHistory.findById(rdrh)
                        .then(rrh => {
                            
                            if(rrh) {
                                if(!(evaluatorsId.includes(rrh.evaluatorEvaluatedRelation[0].toString()))) {
                                    evaluatorsId.push(rrh.evaluatorEvaluatedRelation[0].toString());
                                }
                            }
                            
                            counter += 1;
                            if((counter === 20) || counter === returnedDocument.rateHistory.length) {
                                Evaluator.find({
                                    "_id": { $in: evaluatorsId },
                                }).sort({ createdAt: -1, })
                                    .then(revs => {
                                        //console.log(revs.length);
                                        //console.log({revs})
                                        let counter2 = 0;

                                        for(let rev of revs) {
                                            counter2 += 1;
                                            const rhtsid = rev.rateHistory[rev.rateHistory.length - 1];
                                            const lastRevId = revs[revs.length - 1]._id;

                                            RateHistory.findById(rhtsid)
                                                .then(srchdrh => {
                                                    if(srchdrh) {
                                                        const dtsrch = srchdrh.evaluatorEvaluatedRelation[1], 
                                                        dtsrchtp = srchdrh.evaluatorEvaluatedTypesRelation[1];

                                                        auxObject[dtsrchtp].findById(dtsrch)
                                                            .then(rtrnddc => {
                                                                if(rtrnddc) {
                                                                    toReturn.push(rtrnddc);
                                                                }
                                                                console.log(toReturn.length);

                                                                if(toReturn.length === 180) {
                                                                    console.log({
                                                                        rateH,
                                                                        lastRateH,
                                                                        rdrh,
                                                                        lastRdrh,
                                                                        [rev._id] : [rev._id],
                                                                        lastRevId,
                                                                    })
                                                                }

                                                                if((rateH === lastRateH) && 
                                                                    (rdrh === lastRdrh) &&
                                                                    (rev._id === lastRevId)) {
                                                                    //console.log(toReturn.length);
                                                                    console.log({
                                                                        lastRateH,
                                                                        lastRdrh,
                                                                        lastRevId,
                                                                    })
                                                                    return(toReturn);
                                                                }
                                                            })
                                                            .catch(err => {
                                                                console.log('7:')
                                                                //console.log(err)
                                                            });
                                                    }

                                                    else {
                                                        if((rateH === lastRateH) && 
                                                            (rdrh === lastRdrh) &&
                                                            (rev._id === lastRevId)) {
                                                            //console.log(toReturn.length);
                                                            console.log({
                                                                lastRateH,
                                                                lastRdrh,
                                                                lastRevId,
                                                            })
                                                            return(toReturn);
                                                        }
                                                    }
                                                })
                                                .catch(err => {
                                                    console.log('6:')
                                                    console.log(err)
                                                });

                                        }
                                        // if((counter0 === 10) || (counter0 === rateHistory.length)) {
                                        //     res.json('gg');
                                        // }

                                    })
                                    .catch(err => {
                                        console.log('5:')
                                        console.log(err)
                                    });

                                return '';
                            }
                        })
                        .catch(err => {
                            counter += 1;
                            console.log('4:')
                            console.log(err)
                        });

                }
            }

            else{
                return([]);
            }
        })
        .catch(err => {
            return(err);
        });
}

//return sugestions for the home page according to the user lasts rated content
router.route('/return_home_sugestions').post(async (req, res) => {
    const userId = await getEvaluatorIdBySessionId(req.body.sessionId);
    
    Evaluator.findById(userId)
        .then(evaluator => {
            const rhb = evaluator.rateHistory[req.body.n];
            if(rhb) {
                RateHistory.findById(rateH)
                    .then(raH => {
                        if(raH) {
                            const documentType = raH.evaluatorEvaluatedTypesRelation[1],
                            documentId = raH.evaluatorEvaluatedRelation[1];

                            res.json(whatToSugest(documentType, documentId));
                        }
                    })
                    .catch(err => {
                        console.log('1:')
                        console.log(err)
                    });

            }

            else {
                res.json([]);
            }
        })
        .catch(err => {
            console.log('2:')
            console.log(err)
        });


        //     const rateHistory = ;
        //     let counter0 = 0, evaluatorsId = [], toReturn = [], 
        //         pol0 = false, pol1 = false;
            
        //     for(let rateH of rateHistory) {
        //         counter0 += 1;
        //         const lastRateH = rateHistory[rateHistory.length - 1];
                
        //         if(rateH === lastRateH) {
        //             pol0 = true;
        //         }
        //         //get the model (object, evaluator, post etc) that the user rated

        //         //get the rateHistory document and through it, get the model
        //         RateHistory.findById(rateH)
        //             .then(raH => {
        //                 if(raH) {
        //                     const documentType = raH.evaluatorEvaluatedTypesRelation[1],
        //                     documentId = raH.evaluatorEvaluatedRelation[1];
                        
        //                     //console.log(documentType, documentId);

                            
        //                 }

        //                 else{
        //                     if((rateH === lastRateH)) {
        //                         res.json(toReturn);
        //                     }
        //                 }

        //             })
        //             .catch(err => {
        //                 console.log('2:')
        //                 console.log(err)
        //             });
                
        //         if((counter0 === 10) || (counter0 === rateHistory.length)) {
        //             return '';
        //         }
        //     }

        // })
        

})

router.route('/return_home_sugestions_aaaaaaaaaaa').post(async (req, res) => {
    const userId = await getEvaluatorIdBySessionId(req.body.sessionId);
    auxObject = {
        object: ObjectModel,
        evaluator: Evaluator,
        post: Post,
        segredinho: Segredinho,
        queima: Queima,
        belle: Belle,
        comment: Comment,
    }

    Evaluator.findById(userId)
        .then(evaluator => {
            const rateHistory = evaluator.rateHistory;
            let counter0 = 0, evaluatorsId = [], toReturn = [], 
                pol0 = false, pol1 = false;
            
            for(let rateH of rateHistory) {
                counter0 += 1;
                const lastRateH = rateHistory[rateHistory.length - 1];
                
                if(rateH === lastRateH) {
                    pol0 = true;
                }
                //get the model (object, evaluator, post etc) that the user rated

                //get the rateHistory document and through it, get the model
                RateHistory.findById(rateH)
                    .then(raH => {
                        if(raH) {
                            const documentType = raH.evaluatorEvaluatedTypesRelation[1],
                            documentId = raH.evaluatorEvaluatedRelation[1];
                        
                            //console.log(documentType, documentId);

                            auxObject[documentType].findById(documentId)
                                .then(returnedDocument => {
                                    //get the evaluators that evaluated returnedDocument

                                    if(returnedDocument){
                                        let counter1 = 0;

                                        for(let rdrh of returnedDocument.rateHistory.reverse()) {
                                            const lastRdrh = returnedDocument.rateHistory
                                                .reverse()[returnedDocument.rateHistory.reverse().length - 1];

                                            if(pol0 && (rdrh === lastRdrh)) {
                                                pol1 = true;
                                            }
                                            
                                            RateHistory.findById(rdrh)
                                                .then(rrh => {
                                                    counter1 += 1;

                                                    if(rrh) {
                                                        if(!(evaluatorsId.includes(rrh.evaluatorEvaluatedRelation[0].toString()))) {
                                                            evaluatorsId.push(rrh.evaluatorEvaluatedRelation[0].toString());
                                                        }
                                                    }
                                                    
                                                    if((counter1 === 20) || counter1 === returnedDocument.rateHistory.length) {
                                                        Evaluator.find({
                                                            "_id": { $in: evaluatorsId },
                                                        }).sort({ createdAt: -1, })
                                                            .then(revs => {
                                                                //console.log(revs.length);
                                                                //console.log({revs})
                                                                let counter2 = 0;

                                                                for(let rev of revs) {
                                                                    counter2 += 1;
                                                                    const rhtsid = rev.rateHistory[rev.rateHistory.length - 1];
                                                                    const lastRevId = revs[revs.length - 1]._id;

                                                                    RateHistory.findById(rhtsid)
                                                                        .then(srchdrh => {
                                                                            if(srchdrh) {
                                                                                const dtsrch = srchdrh.evaluatorEvaluatedRelation[1], 
                                                                                dtsrchtp = srchdrh.evaluatorEvaluatedTypesRelation[1];

                                                                                auxObject[dtsrchtp].findById(dtsrch)
                                                                                    .then(rtrnddc => {
                                                                                        if(rtrnddc) {
                                                                                            toReturn.push(rtrnddc);
                                                                                        }
                                                                                        console.log(toReturn.length);

                                                                                        if(toReturn.length === 180) {
                                                                                            console.log({
                                                                                                rateH,
                                                                                                lastRateH,
                                                                                                rdrh,
                                                                                                lastRdrh,
                                                                                                [rev._id] : [rev._id],
                                                                                                lastRevId,
                                                                                            })
                                                                                        }

                                                                                        if((rateH === lastRateH) && 
                                                                                            (rdrh === lastRdrh) &&
                                                                                            (rev._id === lastRevId)) {
                                                                                            //console.log(toReturn.length);
                                                                                            console.log({
                                                                                                lastRateH,
                                                                                                lastRdrh,
                                                                                                lastRevId,
                                                                                            })
                                                                                            res.json(toReturn);
                                                                                            return '';
                                                                                        }
                                                                                    })
                                                                                    .catch(err => {
                                                                                        console.log('7:')
                                                                                        //console.log(err)
                                                                                    });
                                                                            }

                                                                            else {
                                                                                if((rateH === lastRateH) && 
                                                                                    (rdrh === lastRdrh) &&
                                                                                    (rev._id === lastRevId)) {
                                                                                    //console.log(toReturn.length);
                                                                                    console.log({
                                                                                        lastRateH,
                                                                                        lastRdrh,
                                                                                        lastRevId,
                                                                                    })
                                                                                    res.json(toReturn);
                                                                                    return '';
                                                                                }
                                                                            }
                                                                        })
                                                                        .catch(err => {
                                                                            console.log('6:')
                                                                            console.log(err)
                                                                        });

                                                                }
                                                                // if((counter0 === 10) || (counter0 === rateHistory.length)) {
                                                                //     res.json('gg');
                                                                // }

                                                            })
                                                            .catch(err => {
                                                                console.log('5:')
                                                                console.log(err)
                                                            });

                                                        return '';
                                                    }
                                                })
                                                .catch(err => {
                                                    console.log('4:')
                                                    console.log(err)
                                                });

                                        }
                                    }

                                    else{
                                        if((rateH === lastRateH)) {
                                            res.json(toReturn);
                                        }
                                    }
                                })
                                .catch(err => {
                                    console.log('3:')
                                    console.log(err)
                                });
                        }

                        else{
                            if((rateH === lastRateH)) {
                                res.json(toReturn);
                            }
                        }

                    })
                    .catch(err => {
                        console.log('2:')
                        console.log(err)
                    });
                
                if((counter0 === 10) || (counter0 === rateHistory.length)) {
                    return '';
                }
            }

        })
        .catch(err => {
            console.log('1:')
            console.log(err)
        });

})

//return sugestions for the home page according to the user lasts rated content
router.route('/update_models').get(async (req, res) => {
    const auxObject = {
        object: ObjectModel,
        //evaluator: Evaluator,
        post: Post,
        segredinho: Segredinho,
        queima: Queima,
        belle: Belle,
        comment: Comment,
        notification: Notification,
        //rateHistory: RateHistory,
    }

    const keys = Object.keys(auxObject);

    for(let key of keys) {
        console.log(key);

        auxObject[key].find()
            .then(results => {
                for(let result of results) {
                    // result.type = key;
                    const auxArray = result.rateHistory;

                    if(auxArray) {
                        console.log(auxArray.length);
                        for(let rateH of auxArray) {
                            RateHistory.findById(rateH)
                                .then(rateHistory => {
                                    if(rateHistory) {
                                        rateHistory.evaluatorEvaluatedTypesRelation = [
                                            "evaluator",
                                            key,
                                        ]
        
                                        rateHistory.markModified('evaluatorEvaluatedTypesRelation');
        
                                        rateHistory.save()
                                            .then(() => {})
                                            .catch(err => {
                                                console.log(err);
                                            });
        
                                        //return '';
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                });
                        }
                        // result.save();
                    }
                    
                }
            })
            .catch(err => {
                console.log(err);
            });
    }
    res.json('nhaha');
})

//doing this now most for fun
//pearson correlation between two users
router.route('/pearson_correlation_between_two_users').post(async (req, res) => {
    const users = [ req.body.id1, req.body.id2 ];

    Evaluator.find({
        '_id': { $in: users },
    })
        .then(evaluators => {
            const ev1 = evaluators[0], ev2 = evaluators[1];
            const ratedPosts = belongToBoth(ev1.ratedPosts, ev2.ratedPosts);
            const rplen = ratedPosts.length;
            let counter = 0;
            let x1 = [], x2 = [];
            let simil;

            for(let rp of ratedPosts) {
                

                RateHistory.find({
                    'evaluatorEvaluatedRelation': [ev1._id, rp._id],
                })
                    .then(([ rndrh1 ]) => {
                        if(rndrh1) {
                            
                            RateHistory.find({
                                'evaluatorEvaluatedRelation': [ev2._id, rp._id],
                            })
                                .then(([ rndrh2 ]) => {
                                    if(rndrh2) {
                                        counter += 1;
                                        //if both rateHistory exist, use then in the calculation
                                        x1.push(Number(rndrh1.submittedRate));
                                        x2.push(Number(rndrh2.submittedRate));

                                        if(counter === rplen) {
                                            //at this point, there's all the data necessary to calculate simil
                                            let x1m = 0, x2m = 0;
                                            let nume = 0, denom = 0;    
                                            let counter1 = 0;
                                            let canContinue = true;
                                            const x1len = x1.length;
                                            let aux1 = 0, aux2 = 0;

                                            while(canContinue) {
                                                console.log({
                                                    counter1,
                                                    nume,
                                                    denom,
                                                    aux1,
                                                    aux2,
                                                })

                                                if(counter1 < x1len) {
                                                    x1m += x1[counter1];
                                                    x2m += x2[counter1];
                                                    counter1 += 1;
                                                }
                                                
                                                else if(counter1 === x1len) {
                                                    x1m /= x1len;
                                                    x2m /= x1len;
                                                    
                                                    counter1 += 1;
                                                    
                                                }

                                                else if(counter1 < 2 * x1len) {
                                                    nume += (x1[counter1 - (x1len + 1)] - x1m) * (x2[counter1 - (x1len + 1)] - x2m);

                                                    aux1 += Math.pow((x1[counter1 - (x1len + 1)] - x1m), 2);
                                                    aux2 += Math.pow((x2[counter1 - (x1len + 1)] - x2m), 2);

                                                    counter1 += 1;
                                                }

                                                else if(counter1 === 2 * x1len) {
                                                    denom = (Math.pow(aux1, 1/2)) * (Math.pow(aux2, 1/2));

                                                    simil = nume / denom;

                                                    canContinue = false;

                                                    res.json({
                                                        simil: simil,
                                                        x1: x1,
                                                        x2: x2,
                                                        x1m: x1m,
                                                        x2m: x2m,
                                                        len: rplen,
                                                        path: 'right',
                                                    })
                                                }

                                            }
                                        }
                                    }
            
                                    else {
                                        counter += 1;
                                        if(counter === rplen) {
                                            res.json({
                                                simil: simil,
                                                x1: x1,
                                                x2: x2,
                                                len: rplen,
                                                path: 'wrong2',
                                            })
                                        }
                                    }
                                })
                                .catch(err => console.log('2:' + err));
                        }

                        else {
                            counter += 1;
                            if(counter === rplen) {
                                res.json({
                                    simil: simil,
                                    x1: x1,
                                    x2: x2,
                                    len: rplen,
                                    path: 'wrong1',
                                })
                            }
                        }
                    })
                    .catch(err => console.log('1:' + err));

            }
        })
        .catch(err => console.log('0' + err));

})

const returnDocuments = async (ids, result, whichModel) => {
    const auxObject = {
        object: FdObject,
        post: Post,
        queima: Queima,
        belle: Belle,
        comment: Comment,
        segredinho: Segredinho,
    }

    const recIndexes = result.slice(0, 100);
    const recIds = [];

    for(let rId of recIndexes) {
        recIds.push(ids[rId]);
    }

    const documents = await auxObject[whichModel].find({
        '_id': { $in: recIds },
        'commentOn': { $ne: 'object' },
    }, 'id type content userName userUsername userProfilePictureUrl rate rateNumber name nickname categories description urls createdAt')

    return documents;
}

async function getDocumentRecommendations(evaluatorId, includeAsRated) {
    
    const auxObject = {
        object: ObjectModel,
        post: Post,
        queima: Queima,
        belle: Belle,
        comment: Comment,
        segredinho: Segredinho,
    }

    const keys = Object.keys(auxObject);
    let toReturn = [];
    
    for(let key of keys) {
        const ratings = [], dIds = [];
        const auxString = 'rated' + key[0].toUpperCase() + key.substring(1,20) + 's';

        let evaluatorToRecommendTo = await Evaluator.findById(evaluatorId, auxString);
        let evaluatorsToCompareWith = await Evaluator.find({}, auxString,  {limit: 3000});
        let documents = await auxObject[key].find({}, 'id', {limit: 10000, sort: {createdAt: -1}});

        //console.log(documents.length);
        if(!(documents.length)) {
            continue;
        }

        //fill the ratings array
        evaluatorToRecommendTo[auxString] = evaluatorToRecommendTo[auxString].concat(includeAsRated[key + 's']);

        const trmInd = evaluatorsToCompareWith.findIndex(
            (el) => {
                if(el._id.toString() === evaluatorToRecommendTo._id.toString()) {
                    return el;
                }
            }
        );

        if(!(trmInd === -1)) {
            evaluatorsToCompareWith = evaluatorsToCompareWith.slice(0, trmInd).concat(evaluatorsToCompareWith.slice(trmInd + 1, evaluatorsToCompareWith.length));
        }

        evaluatorsToCompareWith.unshift(evaluatorToRecommendTo);

        const evLen = evaluatorsToCompareWith.length;
        let counter1 = 0, addId = true;

        for(let ev of evaluatorsToCompareWith) {
            const auxArray = [];
    
            for(let p of documents) {
                if(ev[auxString].includes(p._id.toString())) {
                    auxArray.push(1);
                }
    
                else {
                    auxArray.push(0);
                }
    
                if(addId) {
                    dIds.push(p._id);
                }
            }
    
            addId = false;
            ratings.push(auxArray);
            counter1 += 1;
    
            if(counter1 === evLen) {
                const result = recommend.cFilter(ratings, 0);
                
                //console.log(result);

                if(result.length) {
                    if(result[0] === -1) {
                        const recommendations = await returnDocuments(dIds, [0,1,2,3,4,5], key);
                        
                        toReturn = toReturn.concat(recommendations);
                        // return({
                        //     result: result,
                        //     rec: recommendations,
                        // });
                    }
    
                    else {
                        const recommendations = await returnDocuments(dIds, result, key);
                        //console.log({dIds, result})

                        toReturn = toReturn.concat(recommendations);
                        // return({
                        //     result: result,
                        //     rec: recommendations,
                        // });
                    }
                }
    
                else {
                    toReturn = toReturn.concat([]);

                    // return({
                    //     result: [],
                    //     rec: [],
                    // });
                }
            }
    
        }

    }

    toReturn = toReturn.sort(function(a, b){return b.createdAt - a.createdAt}).slice(0, 100);
    
    return toReturn;

}

router.route('/get_recommendations').post(async (req, res) => {

    let recommendations = [], numberOfRatedDocuments = 0;

    if(req.body.sessionId) {
        const evaluatorId = await getEvaluatorIdBySessionId(req.body.sessionId);
        const includeAsRated = req.body.includeAsRated;

        const [ tempEvaluator ] = await Evaluator.find({
                _id: evaluatorId,
            }, 'ratedObjects ratedComments ratedPosts ratedSegredinhos ratedQueimas ratedBelles');

        numberOfRatedDocuments = tempEvaluator.ratedObjects.length + 
            tempEvaluator.ratedComments.length +  tempEvaluator.ratedPosts.length +
            tempEvaluator.ratedSegredinhos.length +  tempEvaluator.ratedQueimas.length +
            tempEvaluator.ratedBelles.length;

        

        if(numberOfRatedDocuments) {
            recommendations = await getDocumentRecommendations(evaluatorId, includeAsRated);
        }
    }

    if(!(req.body.sessionId) || !(numberOfRatedDocuments)) {
        let auxArray = await Belle.find({
                },
                'id type content userName userUsername userProfilePictureUrl rate rateNumber createdAt'
            )
            .sort({ rate: -1, }).limit(10);

        recommendations = recommendations.concat(auxArray);

        auxArray = await Post.find({
                },
                'id type content userName userUsername userProfilePictureUrl rate rateNumber createdAt'
            )
            .sort({ rate: -1, }).limit(80);
            
        recommendations = recommendations.concat(auxArray);

        auxArray = await FdObject.find({
                },
                'id type rate rateNumber name nickname categories description urls createdAt'
            )
            .sort({ rate: -1, }).limit(40);
            
        recommendations = recommendations.concat(auxArray);

        auxArray = await Queima.find({
            },
            'id type content userName userUsername userProfilePictureUrl rate rateNumber createdAt'
        )
        .sort({ rate: -1, }).limit(7);

        recommendations = recommendations.concat(auxArray);
    }

    res.json({
        recommendations: recommendations,
    });

})

router.route('/update_evaluators_profile_pic').get((req, res) => {
    Evaluator.find()
        .then(evaluators => {
            for(let ev of evaluators) {
                if(!(ev.profilePictureUrl)) {
                    ev.profilePictureUrl = process.env.AWS_BUCKET_URL + "defaultEvaluatorProfilePicture.png";
                    updateEvaluatorProfilePictureTrack(process.env.AWS_BUCKET_URL + "defaultEvaluatorProfilePicture.png", ev);

                    ev.save()
                        .then(() => {})
                        .catch(() => {})
                }
            }

            res.json('yup')
        })
})

module.exports = router;