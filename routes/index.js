const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = "SUPER SECRET KEY DO NOT STEAL";

router.get("/me", function (req, res, next) {
  res.status(200).json(
    {
      "name": "Daniel Lopez",
      "student_number": "n10956611"
    }
  )
})


router.get("/countries", function (req, res, next) {
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
      res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
    });
});

// volcanoes?country=japan&populatedWithin=5km 
router.get("/:volcanoes", function (req, res, next) {
  let setDistance;

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
        res.json({ Error: true, Message: "Invalid value for populatedWithin: 15km. Only: 5km,10km,30km,100km are permitted." });
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
          res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
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
          res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
        });
    }
  } else {
    res.status(400).json({ Error: true, Message: "Country is a required query parameter." });
  }
});

// check is current token is valid
// @param auth takes req.headers.authorization
const authCheck = function (auth) {
  let response = false;
  if (!auth || auth.split(" ").length !== 2) {
    response = false;
  } else {
    const token = auth.split(" ")[1];
    try {      
      const payload = jwt.verify(token, secretKey);
      if (Date.now() > payload.exp) {
        response = false;
        return;
      }      
      response = true;
    } catch (e) {      
      response = false;
      return;
    }
  }
  return response
}


router.get("/volcano/:id", function (req, res, next) {
  let selectSQL = ["id", "name", "country", "region", "subregion", "last_eruption", "summit", "elevation", "latitude", "longitude"];
  if (req.headers.authorization) {
    let auth = authCheck(req.headers.authorization);
    if (auth) {
      selectSQL = "*"
    } else {
      res.status(401).json({
        Error: true,
        Message: "Invalid JWT token"
      });
      return;
    }

  }
  req.db
    .from("data")
    .select(selectSQL)
    .where("id", "=", req.params.id)
    .then((rows) => {
      if (rows.length === 0) {
        res.json({ Error: true, Message: "Volcano with ID: " + req.params.id + " not found." });
        return;
      }
      res.json(rows);
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
    });

});

router.post('/register', function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      Error: true,
      Message: "Request body incomplete, both email and password are required"
    });
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    res.status(400).json({
      Error: true,
      Message: "Invalid format email address"
    });
    return;
  }

  req.db.from("users").select("*").where({ email })
    .then(users => {
      if (users.length > 0) {
        res.status(409).json({
          Error: true,
          Message: "User already exists"
        });
        return;
      }

      const hash = bcrypt.hashSync(password, 10);
      req.db.from("users").insert({ email, hash })
        .then(() => {
          res.status(200).json({
            Error: false,
            Message: "User created"
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            Error: true,
            Message: "Error in MySQL query"
          })
        });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        Error: true,
        Message: "Error in MySQL query"
      })
    });
});

router.post('/login', function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      Error: true,
      Message: "Request body incomplete, both email and password are required"
    });
    return;
  }
  req.db.from("users").select("*").where({ email })
    .then(users => {
      if (users.length === 0) {
        res.status(401).json({
          Error: true,
          Message: "Incorrect email or password"
        });
        return;
      }

      const { hash } = users[0];

      if (!bcrypt.compareSync(password, hash)) {
        res.status(401).json({
          Error: true,
          Message: "Incorrect email or password"
        });
        return;
      }
      const expires_in = 60 * 60 * 24;

      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);

      res.status(200).json({
        token,
        token_type: "Bearer",
        expires_in
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        Error: true,
        Message: "Error in MySQL query"
      })
    });
});


module.exports = router;
