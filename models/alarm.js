const mongoose = require('mongoose');
const { Schema } = mongoose;

const alarm = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true },
    userList: { type: Array, required: true },
    eventType: { type: String, required: true },
    cardId: { type: mongoose.Types.ObjectId, required: true },
    checked: { type: Boolean, required: true },
},
    { timestamps: true });


// 하이하이 상균님 계시나여
// 안계세요
// 어디가셨나여 지금 저 수정해야하는데
// 지금 테이블에 있어요
alarm.virtual('AlarmId').get(function () {
    return this._id.toHexString();
});

alarm.set('toObject', {
    virtuals: true
});
alarm.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Alarm', alarm);
