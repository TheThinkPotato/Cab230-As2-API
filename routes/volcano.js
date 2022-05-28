const express = require("express");
const router = express.Router();

const authCheck = require("../functions/authCheck");
  
  router.get("/:id", function (req, res, next) {
    let selectSQL = ["id", "name", "country", "region", "subregion", "last_eruption", "summit", "elevation", "latitude", "longitude"];
    let auth = { error: true }
    if (req.headers.authorization) {
      auth = authCheck.check(req.headers.authorization);
      if (!auth.error) {
        selectSQL = "*"
      } else {
        res.status(401).json(auth
        );
        return;
      }
  
    }
    req.db
      .from("data")
      .select(selectSQL)
      .where("id", "=", req.params.id)
      .then((rows) => {
        if (rows.length === 0) {
          if (auth.error === true) {
            res.status(404).json({ error: true, message: "Not Found" });
            return;
          } else {
            res.status(404).json({ error: true, message: "Volcano with ID: " + req.params.id + " not found." });
            return;
          }
        }
        res.json(rows[0]);
      })
      .catch((err) => {
        console.log(err);
        res.status(404).json({ error: true, message: "Not Found" });
      });
  
  });

  module.exports = router;
  