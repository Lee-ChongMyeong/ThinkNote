const express = require('express');
const router = express.Router();
const { AnswerCard, User, Friend, Like, CommentBoard } = require('../../models');
const authMiddleware = require('../../auth/authMiddleware');
const jwt = require('jsonwebtoken');
const sanitize = require('sanitize-html');

router.get('/:questionId', async(req,res) => {
    const { authorization } = req.headers;
    try{
        if(authorization) {
            const [tokenType, tokenValue] = authorizait
        }
    }catch(err){
        console.log("토큰 해독 에러'")
    }
    }
})