const express = require('express');
const router = express.Router();
const { AnswerCard, User, QuestionCard, Friend, Like, Alarm, CommentBoard, Search } = require('../models');
require('dotenv').config();



// // 답변 많은순 질문 받아오기
// router.get(`/test`, async (req, res) => {
//     const questionList = await QuestionCard.find({ userId: "608971a172444320da6e8671" })
//     let adminQuestion = [];
//     for (questionListData of questionList) {
//         const answerList = await AnswerCard.find({questionId : questionListData._id })
//         let answerListCount = answerList.length;
        
//         adminQuestion.push({
//          questionId : questionListData._id,
//         })
    
//         return res.json(adminQuestion)
//     }

// res.json({ questionlist })
// })

module.exports = router;
