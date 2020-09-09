const sjcl = require('sjcl');

const router = require('express').Router();

//test
router.route('/').get((req, res) => {

    // const encrypted = sjcl.encrypt('batata', 'il be your enigma');
    // const decrypted = sjcl.decrypt('batata', encrypted);

    // console.log({
    //     encrypted,
    //     decrypted,
    // })

    // res.json({
    //     encrypted: encrypted,
    //     //decrypted: decrypted,
    // });

    res.json({
        cavalo: 'cavalo',
        sgrbrrtr: 'iwaun',
    });

})

module.exports = router;