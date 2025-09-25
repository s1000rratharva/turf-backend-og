import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  console.log("Hello from create-order endpoint");
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in paise
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", order);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

app.listen(5000, () => {
  console.log("✅ Express server running on http://localhost:5000");
});
