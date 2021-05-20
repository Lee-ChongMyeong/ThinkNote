const express = require('express');
const router = express.Router();
const { QuestionCard, AnswerCard, User } = require('../models');

router.get('/:topicName', async (req, res) => {

    let topicName = decodeURIComponent(req.params.topicName);

    let { page } = req.query;
    page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

    const topicQuestion = await QuestionCard.aggregate([
        {
            $match: {
                topic: { $in: [`${topicName}`] }
            }
        },
        {
            $project: {
                _id: 1,
                createdUser: { $toObjectId: '$createdUser' },
                contents: 1,
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdUser',
                foreignField: '_id',
                as: 'createdUserInfo'
            }
        },
        {
            $project: {
                _id: 1,
                topic: 1,
                contents: 1,
                createdUserInfo: 1
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: page * 15 },
        { $limit: 15 }
    ]);

    const result = [];

    for (let i = 0; i < topicQuestion.length; i++) {
        result.push({
            questionId: topicQuestion[i]['_id'],
            contents: topicQuestion[i]['contents'],
            createdUserId: topicQuestion[i]['createdUserInfo'][0]['_id'],
            createdUserNickname: topicQuestion[i]['createdUserInfo'][0]['nickname'],
            createdUserProfileImg: topicQuestion[i]['createdUserInfo'][0]['profileImg']
        })
    }

    return res.send({ result });
});

module.exports = router;
