const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = process.env.APIKEY;

const authCheck = require("../functions/authCheck");
const dateTools = require("../functions/dateTools");

router.post('/register', function (req, res, next) {
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

  //Check user already exists
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



router.get('/:email/profile', function (req, res, next) {
  let selectSQL = ["email", "firstName", "lastName"]
  let userEmail;
  if (req.headers.authorization) {
    let auth = authCheck.check(req.headers.authorization);

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

  //Check email
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

router.put('/:email/profile', function (req, res, next) {
  let userEmail = null;
  let dbEmail = null;
  let authMode;
  const regexName = /^[a-zA-Z ]+$/
  const regexAddr = /^[a-zA-Z0-9\s\,\''\-]*$/
  const regexEmail = /^[^@]+@[^@]+\.[^@]+$/
  const regexDate = /^[0-9][0-9][0-9][0-9]-[0-9][0-9]+-[0-9][0-9]+$/


  const dobWorking = String(req.body.dob).split('-');

  currentDOB = { year: parseInt(dobWorking[0]), month: parseInt(dobWorking[1]), day: parseInt(dobWorking[2]) };
  const today = new Date();
  const currentDate = { year: today.getFullYear(), month: (today.getMonth() + 1), day: today.getDate() };


  // Check if auth ok
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const payload = jwt.verify(token, secretKey);
      userEmail = payload['email'];
    }
    catch (ex) { console.log(ex.message); }

    let auth = authCheck.check(req.headers.authorization);
    if (auth.error) {
      res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
      return;
    }
  }

  // Check number paramaters
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


  //Get User email from db
  req.db
    .from("users")
    .select("email")
    .where("email", "=", req.params.email)
    .then((rows) => {

      dbEmail = rows[0].email;

      //Check if fully authorised or If Authorised with another token to acount or no auth.
      if (userEmail === dbEmail) {
        authMode = "full"
      } else if (userEmail !== null) {

        authmode = "half"
        res.status(403).json({ error: true, message: "Forbidden" })
        return;
      }
      else {
        authmode = "none"
        res.status(401).json({ error: true, message: "Unauthorized" })
        return;
      }

      // console.log("FISRT>>>>>", req.body.firstName, req.body.lastName, req.body.address, req.body.dob);

      //Check if day sits on an invalid leap year
      if (!dateTools.isLeapYear(currentDOB.year) && currentDOB.month === 2 && currentDOB.day == 29) {
        res.status(400).json({
          error: true,
          message: "Bad Request",
        })
        return;
      }
      //Check invalid dates
      if (!regexDate.test(req.body.dob)
        || currentDOB.month > 12 || currentDOB.day > 31
        || !dateTools.validDayCheck(currentDOB.day, currentDOB.month, currentDOB.year)
      ) {
        res.status(400).json({
          error: true,
          message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
        })
        return;
      }

      //Check in the future Dates
      if (!dateTools.dobCheckFuture(currentDOB, currentDate)) {
        res.status(400).json({
          error: true,
          message: "Invalid input: dob must be a date in the past.",
        })
        return;
      }

      // Check input strings
      if (!regexName.test(req.body.firstName) || !regexName.test(req.body.lastName)
        || !regexEmail.test(req.params.email)
        || !regexAddr.test(req.body.address) || typeof req.body.address !== "string"
      ) {
        res.status(400).json({
          error: true,
          message: "Request body invalid: firstName, lastName and address must be strings only.",

        })
        return;
      }

      //Update user
      req.db.from("users").select("*").where("email", "=", req.params.email)
        .then(users => {
          if (users.length === 0) {
            res.status(401).json({
              error: true,
              message: "Incorrect email or password"
            });
            return;
          }
          req.db
            .from("users")
            .update({ 'firstName': req.body.firstName, 'lastName': req.body.lastName, 'dob': req.body.dob, 'address': req.body.address })
            .where("email", "=", req.params.email)
            .then(() => {

              res.status(200).json({
                "email": req.params.email, 'firstName': req.body.firstName, 'lastName': req.body.lastName, 'dob': req.body.dob, 'address': req.body.address
              })
            })
            .catch((err) => {
              console.log(err);
              res.json({ error: true, message: "Invalid query parameters. Query parameters are not permitted." });
            });
        })
    })
});


router.post('/login', function (req, res, next) {  
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    });
    return;
  }

  //Check email and password
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
      //Check passowrd equals db password
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
