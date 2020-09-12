const multer = require("multer");
const path = require("path");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

require('dotenv').config();

const storageTypes = {
    s3: multerS3({
        s3: new aws.S3(),
        bucket: 'f-dyte-upload',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        key: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname)
        },
    }),
};

const upload = multer({
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "image/jpeg",
            "image/pjpeg",
            "image/png",
            "image/gif",
            "image/jpg",
            "video/mp4",
            "video/3gp",
            "video/webm",
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type."));
        }
    },
    
    storage: storageTypes['s3'],
})

module.exports = upload;