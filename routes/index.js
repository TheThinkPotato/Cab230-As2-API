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
      res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
    });
});

// volcanoes?country=japan&populatedWithin=5km 
router.get("/:volcanoes", function (req, res, next) {
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

// check is current token is valid
// @param auth takes req.headers.authorization
const authCheck = function (auth) {
  let response = { error: false, message: "" };
  if (!auth || auth.split(" ").length !== 2) {
    response.error = true;
    response.message = "Authorization header is malformed"
  } else {
    const token = auth.split(" ")[1];
    try {
      const payload = jwt.verify(token, secretKey);
      if (Date.now() > payload.exp) {
        response.error = true;
        response.message = "Expired Token"
        return response;
      }
      response.error = false;
      response.message = "Good"
    } catch (e) {
      response.error = true;
      response.message = "Invalid JWT token"
      return response;
    }
  }
  return response;
}


router.get("/volcano/:id", function (req, res, next) {
  let selectSQL = ["id", "name", "country", "region", "subregion", "last_eruption", "summit", "elevation", "latitude", "longitude"];
  let auth = { error: true }
  if (req.headers.authorization) {
    auth = authCheck(req.headers.authorization);
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
          res.status(404).json("Not Found", { error: true, message: "Not Found" });
          return;
        } else {
          res.status(404).json("Not Found", { error: true, message: "Volcano with ID: " + req.params.id + " not found." });
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

router.post('/user/register', function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Bad Request"
    });
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    res.status(400).json({
      error: true,
      message: "Invalid format email address"
    });
    return;
  }

  req.db.from("users").select("*").where({ email })
    .then(users => {
      if (users.length > 0) {
        res.status(409).json({
          error: true,
          message: "User already exists"
        });
        return;
      }

      const hash = bcrypt.hashSync(password, 10);
      req.db.from("users").insert({ email, hash })
        .then(() => {
          res.status(201).json({
            error: false,
            message: "Created"
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: true,
            message: "Error in MySQL query"
          })
        });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: true,
        message: "Error in MySQL query"
      })
    });
});


//===================================================================================
router.get('/user/:email/profile', function (req, res, next) {
  let selectSQL = ["email", "firstName", "lastName"]
  let userEmail;
  if (req.headers.authorization) {
    let auth = authCheck(req.headers.authorization);

    const token = req.headers.authorization.split(" ")[1];

    // Get email from bearer
    try {
      const payload = jwt.verify(token, secretKey);
      userEmail = payload['email'];

    } catch (e) {
      res.status(401).json({
        error: true,
        message: "Invalid JWT token"
      })
    }

    if (!auth.error) {
      selectSQL = ["email", "firstName", "lastName", "dob", "address"];
    }
  }

  req.db
    .from("users")
    .select(selectSQL)
    .where("email", "=", req.params.email)
    .then((rows) => {
      if (rows.length === 0) {
        res.status(404).json({ error: true, message: "Not Found" })
        return;
      }
      // return less information if bearer email does not match
      console.log(rows[0].email, userEmail)
      if (rows[0].email !== userEmail) {
        res.json({ email: rows[0].email, firstName: rows[0].firstName, lastName: rows[0].lastName })
        return;
      }
      res.json(rows[0]);
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
    });
});


router.put('/user/:email/profile', function (req, res, next) {
  let userEmail;
  let dbEmail;
  if (Object.keys(req.body).length !== 4) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete: firstName, lastName, dob and address are required.",
      email: req.params.email,
      firstName: null,
      lastName: null
    })
    return;
  }

  if (req.headers.authorization) {
    let auth = authCheck(req.headers.authorization);
    if (auth.error) {
      res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
      return;
    }
  } else {
    res.status(401).json({ error: true, message: "Unauthorized" });
    return;

  }
  const token = req.headers.authorization.split(" ")[1];
  // let payload = await jwt.verify(token, secretKey);
  try {
    const payload = jwt.verify(token, secretKey);
    userEmail = payload['email'];
  }
  catch (ex) { console.log(ex.message); }
  // userEmail = payload['email'];
  // // Get email from bearer
  // try {
  //   const payload = jwt.verify(token, secretKey);
  //   userEmail = payload['email'];


  req.db
    .from("users")
    .select("email")
    .where("email", "=", req.params.email)
    .then((rows) => {
      dbEmail = rows[0].email;
    })


    //==============================================Sync PRoblems
    console.log(dbEmail,userEmail);

  if (dbEmail !== userEmail) {
    res.status(403).json({ error: true, message: "Forbidden" })
    return;
  }

  req.db
    .from("users")
    .update({ 'firstName': req.body.firstName, 'lastName': req.body.lastName, 'dob': req.body.DOB, 'address': req.body.address })
    .where("email", "=", req.params.email)
    .then(() => {
      res.status(200).json({
        "email": req.params.email, 'firstName': req.body.firstName, 'lastName': req.body.lastName, 'dob': req.body.DOB, 'address': req.body.address
      })
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
    });
});


router.post('/user/login', function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    });
    return;
  }

  req.db.from("users").select("*").where({ email })
    .then(users => {
      if (users.length === 0) {
        res.status(401).json({
          error: true,
          message: "Incorrect email or password"
        });
        return;
      }

      const { hash } = users[0];

      if (!bcrypt.compareSync(password, hash)) {
        res.status(401).json({
          error: true,
          message: "Incorrect email or password"
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
        error: true,
        message: "Error in MySQL query"
      })
    });



});


module.exports = router;
