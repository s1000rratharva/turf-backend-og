import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Improved CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "https://turf-frontend-og.vercel.app/", // Add your actual frontend domain
    process.env.FRONTEND_URL // You can set this in Render environment variables
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.post("/create-order", async (req, res) => {
  console.log("Received create-order request");
  console.log("Request body:", req.body);
  
  const { amount } = req.body;

  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

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
    res.status(500).json({ 
      error: "Failed to create Razorpay order",
      details: err.error ? err.error.description : err.message 
    });
  }
});

app.listen(5000, () => {
  console.log("✅ Express server running on http://localhost:5000");
});