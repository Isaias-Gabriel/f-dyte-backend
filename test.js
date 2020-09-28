const { hash, compare } = require('./AuxiliaryFunctions/fDyteHash');
const Evaluator = require('./models/evaluator.model');

const router = require('express').Router();

//test
router.route('/').get(async (req, res) => {

    //const { hash }
    //update evaluator's password
    // Evaluator.find({})
    //     .then(evaluators => {
    //         for(let evaluator of evaluators) {
    //             console.log(evaluator.password)
    //             evaluator.password = hash(evaluator.password);
    //             console.log(evaluator._id);
    //             console.log(evaluator.password)
    //             console.log('-------------------');
    //             evaluator.save();
    //         }
    //     })

    res.json({
        cavalo: 'cavalo',
        sgrbrrtr: 'iwaun',
    });
})

//test
router.route('/hash_test').post(async (req, res) => {

    //emili123
    //011041023037023109113127
    const hashedText = hash(req.body.text);
    //const hashedText = hash(Date.now().toString() + req.body.text);
    //compare('011041023037023109113127', req.body.text)

    res.json({
        hashedText: hashedText,
    });
})

module.exports = router;