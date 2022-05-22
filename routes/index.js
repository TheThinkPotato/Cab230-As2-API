var express = require("express");
const { set } = require("express/lib/application");
var router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = "SUPER SECRET KEY DO NOT STEAL";



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
      res.json( countryList        
      )      
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
    });
});

// volcanoes?country=japan&populatedWithin=5km 

router.get("/:volcanoes", function (req, res, next) {  

  const input = req.originalUrl  

  const check = input.slice(1,input.indexOf("?"));  

  if(check === "volcanoes" & input.indexOf("&") > 0 )
  {
  const country = input.slice(input.indexOf("=")+1,input.indexOf("&"));
  const distance = input.slice(input.lastIndexOf("=")+1);
  let setDistance = "population_5km"

  if(distance === "5km")
  {
    setDistance = "population_5km";
  }
  else if(distance === "10km")
  {
    setDistance = "population_10km";
  }
  else if(distance === "30km")
  {
    setDistance = "population_10km";
  }
  else if(distance === "100km")
  {
    setDistance = "population_100km";
  }
  else{
    res.json({ Error: true, Message: "Invalid value for populatedWithin: 15km. Only: 5km,10km,30km,100km are permitted." });
    return;
  }
  req.db
    .from("data")    
    .select("id" ,"name","country","region","subregion")
    .where("country", "=", country)
    .where(setDistance, "!=", 0)
    .then((rows) => {
      res.json(rows);
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
    });

  }else if (check === "volcanoes"){
    const country = input.slice(input.indexOf("=")+1)
    req.db
    .from("data")
    .select("id" ,"name","country","region","subregion")    
    .where("country", "=", country)
    .then((rows) => {
      res.json(rows);
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });
    });

  }
  else{      
    res.json({ Error: true, Message: "Invalid query parameters. Query parameters are not permitted." });    
  }
  
});

router.get("/api/city/:CountryCode", function (req, res, next) {
  req.db
    .from("city")
    .select("*")
    .where("CountryCode", "=", req.params.CountryCode)
    .then((rows) => {
      res.json({ Error: false, Message: "Success", Cities: rows });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error executing MySQL query" });
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
          Message: "Email already in use"
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
        res.status(400).json({
          Error: true,
          Message: "User not registered"
        });
        return;
      }

      const { hash } = users[0];

      if (!bcrypt.compareSync(password, hash)) {
        res.status(400).json({
          Error: true,
          Message: "Incorrect password"
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
