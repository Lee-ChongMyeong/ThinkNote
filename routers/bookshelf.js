const express = require('express');
const router = express.Router();

// 책장 확인
router.post('/books/:YYMM', async (req, res, next) => {
    const
    const { YYMM } = req.params
    try {
        const result = await QuestionCard.create({
            contents: req.body['contents'],
        });
        res.json({ status: 'success', books: result });
    } catch (err) {
        res.json({ status: 'fail' });
    }
});

module.exports = router;