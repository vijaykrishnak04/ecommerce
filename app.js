var createError = require("http-errors");
require('dotenv').config()
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const nocache = require("nocache");

var adminRouter = require("./routes/admin");
var usersRouter = require("./routes/users");
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

  // render the error page
  res.status(err.status || 500 || 404);
  res.render("user/error");
});

module.exports = app;
