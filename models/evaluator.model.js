const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const evaluatorSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    name: String,
    username: {
        type: String,
        unique: true
    },
    profilePictureUrl: String,
    profileBackgroundImageUrl: String,
    //Array with ids of documents describing all the ratings that the user have made
    rateHistory: Array,
    
    //Array with the ids of the objects the user rated
    ratedObjects: Array,

    //Array with the ids of the users the user rated
    ratedEvaluators: Array,

    //Array with the ids of the comments the user rated
    ratedComments: Array,

    //Array with the ids of the posts the user rated
    ratedPosts: Array,
    //Array with the ids of the segredinhos the user rated
    ratedSegredinhos: Array,
    //Array with the ids of the queimas the user rated
    ratedQueimas: Array,
    //Array with the ids of the belles the user rated
    ratedBelles: Array,

    //Array with the ids of the posts the user rated
    ratedReposts: Array,

    rate: mongoose.Schema.Types.Decimal128,
    //number of times the user has been rated
    rateNumber: Number,
    //array with the ids of the objects that the user is following
    followedObjects: Array,
    //array with the ids of the evaluators that the user is following
    followedEvaluators: Array,
    //array with the users ids that are following the user
    followedBy: Array,

    //array with notifications ids
    notifications: Array,

    //array with post documents ids 
    posts: Array,
    //array with segredinho documents ids 
    segredinhos: Array,
    //array with queima documents ids 
    queimas: Array,
    //array with belle documents ids 
    belles: Array,

    //array with comments documents ids
    //comments the user made
    //in the future maybe split into comments for posts, objects and comments
    comments: Array,

    //it says the model is of an evaluator
    type: {
        type: String,
        default: 'evaluator',
    }
}, 
{
    timestamps: true,
});

const Evaluator = mongoose.model('Evaluator', evaluatorSchema);

module.exports = Evaluator;