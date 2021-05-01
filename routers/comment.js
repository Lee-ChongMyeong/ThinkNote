const express = require('express');
const router = express.Router();
const sanitize = require('sanitize-html');
const { CommentBoard, User, AnswerCard } = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const jwt = require('jsonwebtoken')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// 댓글 리스트
router.get('/:cardId', async (req, res, next) => {
   const cardId = req.params.cardId;
   let result = { msg: 'success', comments: [] };
   try {
      //const comments = await CommentBoard.find({ cardId: cardId }).populate({path:"user"});
      const comments = await CommentBoard.find({ cardId: cardId }).sort({ date: -1 });
      for (comment of comments) {
         const userInfo = await User.findOne({ _id: comment.userId })
         let temp = {
            commentId: comment.commentId,
            commentContents: sanitize(comment.commentContents),
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
   const cardId = req.params.cardId;
   const user = res.locals.user;
   const { userId } = await AnswerCard.findOne({ _id: cardId })
   try {
      let result = {
				cardId: cardId,
				commentContents: sanitize(req.body.commentContents),
				userId: sanitize(user.id),
			};
      console.log(result)
      console.log(await CommentBoard.create(result));
      result["nickname"] = user.nickname,
      result["profileImg"] = user.profileImg
      res.json({ msg: 'success', result: result });
      
      const alarmSend = require('../lib/sendAlarm')
      await alarmSend(userId, cardId, 'comment', user.userId, req.alarm);
      

   } catch (err) {
      console.log(err)
      res.json({ msg: 'fail' });
   }
});

// 댓글 삭제
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
   let result = { msg: 'success' };
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
