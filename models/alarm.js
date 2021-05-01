const mongoose = require('mongoose');
const { Schema } = mongoose;

const alarm = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    userList: { type: Array, required: true },
    eventType: { type: String, required: true },
    cardId: { type: mongoose.Types.ObjectId, required: true },
    checked: { type: Boolean, required: true, default: true },
    date: { type: Date, required: true },
},
    { timestamps: true });


alarm.virtual('alarmId').get(function () {
    return this._id.toHexString();
});

alarm.set('toObject', {
    virtuals: true
});
alarm.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Alarm', alarm);
