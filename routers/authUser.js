const express = require('express');
const router = express.Router();

// 인증 ^^
router.get("/", (req, res) => {
    console.log(req.user)
})

module.exports = router;