const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");


// ==========================
// 1️⃣ CREATE BOOKING
// ==========================
router.post("/:id", isLoggedIn, async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    let checkIn = new Date(req.body.checkIn);
    let checkOut = new Date(req.body.checkOut);

    let nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

    let totalPrice = nights * listing.price;

    const booking = await Booking.create({
        listing: listing._id,
        user: req.user._id,
        checkIn,
        checkOut,
        guests: req.body.guests,
        totalPrice,
        paymentStatus: "pending"   // 💳 IMPORTANT
    });

    req.flash("success", "Booking Created! Now complete payment 💳");

    // 👉 redirect to payment page
    res.redirect(`/bookings/pay/${booking._id}`);
});


// ==========================
// 2️⃣ PAYMENT PAGE ROUTE
// ==========================
router.get("/pay/:id", isLoggedIn, async (req, res) => {

    const booking = await Booking.findById(req.params.id)
        .populate("listing");

    res.render("bookings/payment.ejs", { booking });
});


// ==========================
// 3️⃣ MY BOOKINGS
// ==========================
router.get("/mybookings", isLoggedIn, async (req, res) => {

    const bookings = await Booking.find({
        user: req.user._id
    }).populate("listing");

    res.render("bookings/index.ejs", { bookings });
});


// ==========================
// 4️⃣ CANCEL BOOKING
// ==========================
router.delete("/:id", isLoggedIn, async (req, res) => {

    await Booking.findByIdAndDelete(req.params.id);

    req.flash("success", "Booking cancelled successfully");

    res.redirect("/bookings/mybookings");
});

module.exports = router;