const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentToDescriptionSchema = new Schema({
    auxId: String,
    auxObject: {

    },
}, 
{
    timestamps: true
})

const CommentToDescription = mongoose.model('CommentToDescription', commentToDescriptionSchema);

module.exports = CommentToDescription;