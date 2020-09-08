const mongoose = require('mongoose');
const { boolean } = require('mathjs');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    //a short sentense, e.g. 'x posted/done y'
    content: {
        caption: String,
        text: String,
        url: String,
    },
    userProfilePictureUrl: String,
    //a link adress to where the notification should lead to
    link: String,
    //tells if the notification was read or not
    notificationRead: boolean,
    date: {
        type: Date,
        default: Date.now
    },

    //it says the model is of a notification
    type: {
        type: String,
        default: 'notification',
    }
}, 
{
    timestamps: true
})

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;