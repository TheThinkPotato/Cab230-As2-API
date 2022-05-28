const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
    req.db
        .from("data")
        .select("country")
        .then((rows) => {

            const countrySet = new Set();

            rows.forEach(element => {
                countrySet.add(element.country);
            });

            const countryList = [...countrySet].sort();
            res.json(countryList
            )
        })
        .catch((err) => {
            console.log(err);
            res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
        });
});

module.exports = router;