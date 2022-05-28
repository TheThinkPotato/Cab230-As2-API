const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require('cors');
require('dotenv').config();

const options = require("./knexfile.js");
const res = require("express/lib/response");
const knex = require("knex")(options);
const helmet = require('helmet')
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger.json');

const meRouter = require("./routes/me");
const countriesRouter = require("./routes/countries");
const volcanoRouter = require("./routes/volcano");
const volcanoesRouter = require("./routes/volcanoes");
const userRouter = require("./routes/user");

const app = express();
// view engine setup
app.options('*', cors()) // include before other routes

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());

// logger.token('res', (req, res) => {
//   const headers = {}
//   res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
//   return JSON.stringify(headers)
// });

logger.token('req', (req, res) => JSON.stringify(req.headers))
logger.token('res', (req, res) => {
const headers = {}
res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
return JSON.stringify(headers)
})

app.use("/", swaggerUi.serve);
app.get(
  "/",
  swaggerUi.setup(swaggerDoc, {
    swaggerOptions: { defaultModelsExpandDepth: -1 }, // Hide schema section
  })
);

app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.get("/knex", function (req, res, next) {
  req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });
  res.send("Version Logged successfully");
});



app.use("/countries", countriesRouter);
app.use("/me", meRouter);
app.use("/volcano", volcanoRouter);
app.use("/volcanoes", volcanoesRouter);
app.use("/user", userRouter);


// app.use("/[.a-zA-Z0-9-]+",function ( req,res,next)
app.use("/", function (req, res, next) {
  // res.status(404).json({error: true , message : "Not Found"});
  next(createError(404, "Not Found"));
})




// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


module.exports = app;
