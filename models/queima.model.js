const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const queimaSchema = new Schema({
    //queima info
    date: {
        type: Date,
        default: Date.now
    },
    content: {
        caption: String,
        urls: Array,
    },

    //array with comments ids - allowing users to comment inside the post
    //comments on the post
    comments: Array,

    //rate info
    rateHistory: Array,
    
    rate: mongoose.Schema.Types.Decimal128,
    //number of times the user has been rated
    rateNumber: Number,
    
    //array with the evaluators ids that are following the post
    // followedBy: Array,

    //info about the user that commented
    userProfilePictureUrl: String,
    userProfileBackgroundImageUrl: String,
    
    userName: String,
    userId: mongoose.Schema.Types.ObjectId,
    userUsername: String,

    //it says the model is of a queima
    type: {
        type: String,
        default: 'queima',
    }
}, 
{
    timestamps: true
})

const Queima = mongoose.model('Queima', queimaSchema);

module.exports = Queima;