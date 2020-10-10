const router = require('express').Router();

const Evaluator = require('../../models/evaluator.model');

const Session = require("../../models/session.model");

const RateHistory = require('../../models/rateHistory.model');

const Belle = require('../../models/belle.model');

const { getEvaluatorIdBySessionId,  } = require("../../Controllers/evaluatorSessionController");

const belongToBoth = require('../../AuxiliaryFunctions/belongToBoth');

//get the total number of users
router.get("/total_number_of_users", (req, res) => {
    Evaluator.find({

    }, 'id')
        .then(users => {
            res.json({
                numberOfUsers: users.length,
            })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get some information about the last x (:number) signed up users
router.get("/latest_signed_up_users/:number", (req, res) => {
    console.log()
    Evaluator.find({

    }, 'id email name username rate', {limit: parseInt(req.params.number), sort: {createdAt: -1}})
        .then(users => {
            res.json({
                users: users,
            })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

//get some information about the last x (:number) signed up users
router.get("/number_of_logged_in_users", (req, res) => {
    console.log()
    Session.find({

    }, 'id')
        .then(sessions => {
            res.json({
                sessions: sessions.length,
            })
        })
        .catch(err => res.status(400).json('Error: ' + err));

})

module.exports = router;