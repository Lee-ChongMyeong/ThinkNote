const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const { CommentBoard, User } = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const jwt = require('jsonwebtoken')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// 댓글 리스트
router.get('/:cardId', async (req, res, next) => {
    const cardId = req.params.cardId;
    let result = { msg : 'success', comments: [] };
    try {
       //const comments = await CommentBoard.find({ cardId: cardId }).populate({path:"user"});
       const comments = await CommentBoard.find({cardId : cardId})
       for (comment of comments) {
          const userInfo = await User.findOne({ _id : comment.userId})
          let temp = {
             commentId: comment.commentId,
             commentContents: comment.commentContents,
             userId: comment.userId,
             nickname: userInfo.nickname,
             profileImg: userInfo["profileImg"],
          };
          result['comments'].push(temp);
       }
    } catch (err) {
       result['msg'] = 'fail';
    }
    res.json(result);
 });

// 댓글 입력
router.post('/:cardId', authMiddleware, async (req, res, next) => {
    try {
       const user = res.locals.user;
       userprofile = user["profileImg"];
       const result = await CommentBoard.create({
          cardId: req.params.cardId,
          commentContents: req.body.commentContents,
          nickname: user.nickname,
          userId: user.id,
          user: user["_id"]
       });
       res.json({ msg : 'success', result: result, currentprofile: userprofile });
    } catch (err) {
       res.json({ msg: 'fail' });
    }
 });

// 댓글 삭제
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
    let result = { msg : 'success' };
    try {
       const user = res.locals.user;
       const commentId = req.params.commentId;
       const { deletedCount } = await CommentBoard.deleteOne({ _id: commentId, userId: user.id });
       if (!deletedCount) result['msg'] = 'fail';
    } catch (err) {
       result['msg'] = 'fail';
    }
    res.json(result);
 });

module.exports = router;