const express = require('express');
const router = express.Router();
const { AnswerCard, User, QuestionCard, Friend, Like, Alarm, CommentBoard, Search } = require('../models');
require('dotenv').config();

//어드민 질문 받아오기
router.get(`/${process.env.LOVE_SERVICEINFO_QUESTIONLIST}`, async (req, res) => {

    const questionList = await QuestionCard.find({
        userId: "608971a172444320da6e8671"
    })

    adminQuestion = [];

    for (let i = 0; i < questionList.length; i++) {
        console.log(questionList)

        adminQuestion.push(quesitonList.topic)
        const topic = questionlist.topic
    }

    res.send(questionlist)
})

module.exports = router;
