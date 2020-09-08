const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    sessionIdEvaluatorId: Array,
}, 
{
    timestamps: true
})

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;