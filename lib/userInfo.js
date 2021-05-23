const mongoose = require('../models/mongoose');
const moment = require('moment');

const run = async () => {
    const { AnswerCard, User } = require('../models');

    const day = {
        day: '2021-05-13',
        length: 7
    };

    // 기간 구하기
    const days = [];
    for (let i = 0; i < day.length; i++) {
        const dayInsert = moment(day.day).add(i, 'd').format('YYYY-MM-DD');
        days.push(dayInsert);
    }
    console.log('날짜', days[0], '~', days[days.length - 1]);

    // 기간 동안 가입한 유저 구하기
    const userInfo = [];
    for (let i = 0; i < days.length; i++) {
        const userInfoInsert = await User.find({
            createdAt: { $gte: days[i], $lt: moment(days[i]).add(1, 'd').format('YYYY-MM-DD') }
        });
        for (let j = 0; j < userInfoInsert.length; j++) {
            userInfo.push({
                userId: userInfoInsert[j]['_id'],
                createdAt: days[i]
            });
        }
    }
    const userInfoCount = userInfo.length;
    console.log('가입 유저', userInfoCount);

    // 유저 행동 판단
    const userBehavior = [];
    const userNextDayBehavior = [];
    for (let i = 0; i < userInfo.length; i++) {
        const userAnswer = await AnswerCard.findOne({
            userId: userInfo[i]['userId'],
            createdAt: {
                $gte: userInfo[i]['createdAt'],
                $lt: moment(userInfo[i]['createdAt']).add(1, 'd').format('YYYY-MM-DD')
            }
        });
        if (userAnswer) {
            userBehavior.push(userInfo[i]['userId']);
        }

        const userNextDayAnswer = await AnswerCard.findOne({
            userId: userInfo[i]['userId'],
            createdAt: {
                $gte: moment(userInfo[i]['createdAt']).add(1, 'd').format('YYYY-MM-DD'),
                $lt: moment(userInfo[i]['createdAt']).add(2, 'd').format('YYYY-MM-DD')
            }
        });
        if (userAnswer) {
            if (userNextDayAnswer) {
                userNextDayBehavior.push(userInfo[i]['userId']);
            }
        }
    }
    const userBehaviorCount = userBehavior.length;
    console.log('[유저행동1] 당일 글 쓴 유저', userBehaviorCount);

    const userNextDayBehaviorCount = userNextDayBehavior.length;
    console.log('[유저행동2] 다음날 글 쓴 유저', userNextDayBehaviorCount);

    console.log('=======================');

    console.log('[유저행동1]', `${Math.ceil((userBehaviorCount / userInfoCount) * 100)}` + '%');
    console.log(
        '[유저행동2]',
        `${Math.ceil((userNextDayBehaviorCount / userInfoCount) * 100)}` + '%'
    );
};

run(() => mongoose.disconnect());
