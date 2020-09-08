const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    //post info
    date: {
        type: Date,
        default: Date.now
    },
    content: {
        text: String,
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

    //it says the model is of a post
    type: {
        type: String,
        default: 'post',
    }
}, 
{
    timestamps: true
})

const Post = mongoose.model('Post', postSchema);

module.exports = Post;