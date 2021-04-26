const express = require('express');
const router = express.Router();

// 인증 ^^
router.get("/", (req, res) => {
    console.log(req.user)
    res.json({user:req.user})
})

module.exports = router;
