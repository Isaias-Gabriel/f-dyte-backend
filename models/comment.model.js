const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    //comment info
    date: {
        type: Date,
        default: Date.now
    },
    commentSection: String,
    content: {
        text: String,
        urls: Array,
    },

    //Array with the info of the element the comment is in
    commentOn: Array,
    //array with comments ids - allowing users to comment inside other comments
    comments: Array,

    //rate info
    rateHistory: Array,

    rate: mongoose.Schema.Types.Decimal128,
    //number of times the comment has been rated
    rateNumber: Number,
    
    //array with the evaluators ids that are following the comment
    // followedBy: Array,

    //info about the user that commented
    userProfilePictureUrl: String,
    userProfileBackgroundImageUrl: String,
    
    userName: String,
    userId: mongoose.Schema.Types.ObjectId,
    userUsername: String,

    //it says the model is of a comment
    type: {
        type: String,
        default: 'comment',
    }
}, 
{
    timestamps: true
})

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;