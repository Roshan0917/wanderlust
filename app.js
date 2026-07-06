if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utlis/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// ROUTES
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const wishlistRoutes = require("./routes/wishlist");
const legalRoutes = require("./routes/legal");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment"); // 💳 PAYMENT ROUTES

// DB
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const MONGO_URL = process.env.ATLASDB_URL;

mongoose.connect(MONGO_URL)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log(err));

// VIEW ENGINE
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 💳 IMPORTANT FOR PAYMENT
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// SESSION STORE
const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("SESSION STORE ERROR", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// GLOBAL VARIABLES
app.use(async (req, res, next) => {
    if (req.user) {
        await req.user.populate("wishlist");
    }

    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;

    next();
});

// ROUTES
app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);
app.use("/wishlist", wishlistRoutes);
app.use("/", legalRoutes);
app.use("/bookings", bookingRoutes);

// 💳 PAYMENT ROUTES ADD
app.use("/", paymentRoutes);

// 404
app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let { statusCode = 500 } = err;
    res.status(statusCode).render("error.ejs", { err });
});

// SERVER
app.listen(8080, () => {
    console.log("Server running on port 8080");
});