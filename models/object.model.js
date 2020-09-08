const mongoose = require('mongoose');
const Evaluator = require('./evaluator.model');

const Schema = mongoose.Schema;

const objectSchema = new Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluator',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        unique: true
    },
    categories: {
        type: Array,
        required: true
    },
    description: {
        type: Array,
        required: true
    },
    //Array with urls for the object's media
    urls: {
        type: Array,
        required: true
    },

    //Array with ids of documents describing all the ratings that the user have made
    rateHistory: Array,
    
    rate: mongoose.Schema.Types.Decimal128,
    //number of times the user has been rated
    rateNumber: Number,

    //array with the evaluators ids that are following the object
    followedBy: Array,

    //array with comments documents ids
    //comments on the object
    comments: Array,

    //array with posts documents ids
    //each post describing an update on the object
    posts: Array,

    //it says the model is of an object
    type: {
        type: String,
        default: 'object',
    }
}, 
{
    timestamps: true
});

const Object = mongoose.model('Object', objectSchema);

module.exports = Object;