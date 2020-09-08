const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const segredinhoSchema = new Schema({
    //post info
    date: {
        type: Date,
        default: Date.now
    },
    content: {
        text: String,
        urls: Array,
    },

    originalText: String,

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

    //it says the model is of a segredinho
    type: {
        type: String,
        default: 'segredinho',
    }
}, 
{
    timestamps: true
})

const Segredinho = mongoose.model('Segredinho', segredinhoSchema);

module.exports = Segredinho;