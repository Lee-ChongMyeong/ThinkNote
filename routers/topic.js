const express = require('express');
const router = express.Router();
// const { QuestionCard, AnswerCard, User, Like, CommentBoard } = require('../models');

router.get('/', async (req, res) => {
    let result = { msg: 'success', friendFeed: [] };
    try {
    } catch (err) {
        result['msg'] = 'fail';
    }
    res.json(result);
});

module.exports = router