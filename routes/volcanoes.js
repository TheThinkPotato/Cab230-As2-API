
const express = require("express");
const router = express.Router();

// volcanoes?country=japan&populatedWithin=5km 
router.get("/", function (req, res, next) {
  let setDistance;
  const queryData = req.query;  

  if (Object.keys(queryData).length === 0 || Object.keys(queryData).length > 2) {
    res.status(400).json({ error: true, message: "Bad Request" });
    return;
  }

  if (Object.keys(queryData).length === 2) {
    if ((!("country" in queryData)) || (!("populatedWithin" in queryData))) {
      res.status(400).json({ error: true, message: "Bad Request" });
      return;
    }
  }

  if (req.query.country) {

    if (req.query.populatedWithin) {
      if (req.query.populatedWithin === "5km") {
        setDistance = "population_5km";
      }
      else if (req.query.populatedWithin === "10km") {
        setDistance = "population_10km";
      }
      else if (req.query.populatedWithin === "30km") {
        setDistance = "population_10km";
      }
      else if (req.query.populatedWithin === "100km") {
        setDistance = "population_100km";
      }
      else {
        res.json({ error: true, message: "Invalid value for populatedWithin: 15km. Only: 5km,10km,30km,100km are permitted." });
        return;
      }
      req.db
        .from("data")
        .select("id", "name", "country", "region", "subregion")
        .where("country", "=", req.query.country)
        .where(setDistance, "!=", 0)
        .then((rows) => {
          res.json(rows);
        })
        .catch((err) => {
          console.log(err);
          res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
        });
    } else {
      req.db
        .from("data")
        .select("id", "name", "country", "region", "subregion")
        .where("country", "=", req.query.country)
        .then((rows) => {
          res.json(rows);
        })
        .catch((err) => {
          console.log(err);
          res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
        });
    }
  } else {
    res.status(400).json({ error: true, message: "Country is a required query parameter." });
  }
});
  
  module.exports = router;