const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
    res.status(200).json(
        {
            "name": "Daniel Lopez",
            "student_number": "n10956611"
        }
    )
})


module.exports = router;