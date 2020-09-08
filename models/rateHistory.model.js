const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rateHistorySchema = new Schema({
    //An array with only two elements inside: 
    //0: the evaluator id,
    //1: the evaluated(object, user, post, comment etc) id
    evaluatorEvaluatedRelation: Array,

    //0: the evaluator type,
    //1: the evaluated(object, user, post, comment etc) type
    evaluatorEvaluatedTypesRelation: Array,

    //0: the evaluator id,
    //1: the evaluated(object, user, post, comment etc) id
    evaluatorEvaluatedRateRelation: Array,

    //rate the evaluator submitted
    submittedRate: mongoose.Schema.Types.Decimal128,

    //0: the evaluator id,
    //1: the evaluated(object, user, post, comment etc) id
    evaluatorEvaluatedRateNumberRelation: Array,

    date: {
        type: Date,
        default: Date.now
    },

    //it says the model is of a rateHistory
    type: {
        type: String,
        default: 'rateHistory',
    }
}, 
{
    timestamps: true
})

const RateHistory = mongoose.model('RateHistory', rateHistorySchema);

module.exports = RateHistory;