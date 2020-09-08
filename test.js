const router = require('express').Router();

//test
router.route('/').get((req, res) => {

    res.json({
        cavalo: 'cavalo',
        sgrbrrtr: 'iwaun',
    });

})

module.exports = router;