var createError = require("http-errors");
require('dotenv').config()
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const nocache = require("nocache");

const adminRouter = require("./routes/admin");
const usersRouter = require("./routes/users");


const db = require("./config/connections");

var app = express();
db.dbconnect()

//dot env config



// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//session
app.use(
  session({
    secret: "thisismysecretkey",
    saveUninitialized: true,
    cookie: { maxAge: 6000000 },
    resave: false,
  })
);

//no cache

app.use(nocache());

//routes

app.use("/admin", adminRouter);
app.use("/", usersRouter);

//server listening

app.listen(3000, () => {
  console.log("server started listening to port ");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // set the error status code
  const statusCode = err.status || 500;

  // render the appropriate error page based on the status code
  if (statusCode === 404) {
    res.status(statusCode).render("user/error");
  } else if (statusCode >= 500) {
    res.status(statusCode).render("user/error");
  } else {
    res.status(statusCode).render("user/error");
  }
});


module.exports = app;
