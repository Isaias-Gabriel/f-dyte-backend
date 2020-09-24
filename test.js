const sjcl = require('sjcl');
let nodemailer = require('nodemailer');
let aws = require('aws-sdk');

const router = require('express').Router();

//test
router.route('/').get(async (req, res) => {

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

    // aws.config.loadFromPath('config.json');

    // // Set the region
    // aws.config.update({region: 'us-east-2'});

    // const body_html = `<html>
    //     <head></head>
    //     <body>
    //     <h1>Amazon SES Test (SDK para JavaScript no Node.js)</h1>
    //     <p>This email was sent with
    //         <a href='https://aws.amazon.com/ses/'>Amazon SES</a> using the
    //         <a href='https://aws.amazon.com/sdk-for-node-js/'>
    //         AWS SDK for JavaScript in Node.js</a>.</p>
    //     </body>
    //     </html>`;

    // const subject = "Amazon SES Test (AWS SDK for JavaScript in Node.js)";

    // // The email body for recipients with non-HTML email clients.
    // const body_text = "Amazon SES Test (SDK para JavaScript no Node.js)\r\n"
    //         + "This email was sent with Amazon SES using the "
    //         + "AWS SDK for JavaScript in Node.js.";


    // // Create sendEmail params 
    // let params = {
    //     Destination: { /* required */
    //         CcAddresses: [
    //         'noreply@fdyte.com',
    //         /* more items */
    //         ],
    //         ToAddresses: [
    //         'iiiisaiasgabriel@gmail.com',
    //         /* more items */
    //         ]
    //     },
    //     Message: { /* required */
    //         Body: { /* required */
    //             Html: {
    //                 Charset: "UTF-8",
    //                 Data: body_html,
    //             },
    //             Text: {
    //                 Charset: "UTF-8",
    //                 Data: body_text
    //             }
    //         },
    //         Subject: {
    //             Charset: 'UTF-8',
    //             Data: subject
    //         }
    //     },
    //     Source: 'noreply@fdyte.com', /* required */
    //     ReplyToAddresses: [
    //         'noreply@fdyte.com',
    //         /* more items */
    //     ],
    // };

    // // Create the promise and SES service object
    // let sendPromise = new aws.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

    // // Handle promise's fulfilled/rejected states
    // sendPromise.then(
    //     function(data) {
    //         console.log(data.MessageId);
    //     }
    // ).catch(
    //     function(err) {
    //         console.error(err, err.stack);
    //     }
    // );

    res.json({
        cavalo: 'cavalo',
        sgrbrrtr: 'iwaun',
    });

    // setTimeout(() => {
    //     res.write('22\n');
    //     setTimeout(() => {
    //         res.write('24\n:D');
    //         res.end();
    //     }, 5000);
    // }, 2000);
    
})

module.exports = router;