const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");


// =====================
// CREATE FAKE ORDER
// =====================
router.post("/create-order", (req, res) => {
    try {
        const { amount } = req.body;

        res.json({
            id: "order_FAKE_" + Date.now(),
            amount: amount * 100,
            currency: "INR"
        });

    } catch (err) {
        res.status(500).json({ success: false, message: "Order creation failed" });
    }
});


// =====================
// FAKE PAYMENT SUCCESS
// =====================
router.post("/fake-pay", async (req, res) => {

    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: "bookingId missing" });
        }

        await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: "paid"
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false, message: "Payment update failed" });
    }
});

module.exports = router;