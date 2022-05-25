var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require('cors')
// const helmet = require('helmet')

var corsOptions = {
  origin: 'https://127.0.0.1',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

var indexRouter = require("./routes/index");
// var volcanoesRouter = require("./routes/volcanoes");
// var usersRouter = require("./routes/users");

var app = express();
// view engine setup


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// app.use(helmet());



const options = require("./knexfile.js");
const res = require("express/lib/response");
const knex = require("knex")(options);
app.use((req, res, next) => {
  req.db = knex;
  next();
});

// app.use("/volcanoes", volcanoesRouter);
app.use("/", indexRouter);
// app.use("/users", usersRouter);

app.use("*",function ( req,res,next)
{
  // res.status(404).json({error: true , message : "Not Found"});
  next(createError(404, "Not Found"));
})

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
