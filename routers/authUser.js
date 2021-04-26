const express = require('express');
const router = express.Router();

// 네이버 로그인
router.get("/auth/myInfo", (req, res) => {
    console.log(req.user)
})