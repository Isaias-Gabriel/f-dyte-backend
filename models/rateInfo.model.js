const mongoose = require('mongoose');
const Evaluator = require('./evaluator.model');
const Object = require('./object.model');

const Schema = mongoose.Schema;

const rateInfoSchema = new Schema({
    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluator'
    },
    objectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Object'
    }
},
{
    timestamps: true
});

const RateInfo = mongoose.model('RateInfo', rateInfoSchema);

module.exports = RateInfo;