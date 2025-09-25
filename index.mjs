import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-frontend-domain.vercel.app", // Replace with your actual frontend domain
    "https://*.vercel.app",
    "https://*.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("Health check received");
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    razorpay: !!razorpay ? "Initialized" : "Not initialized"
  });
});

// Create order endpoint
app.post("/create-order", async (req, res) => {
  console.log("📦 Create order request received");
  console.log("Request body:", req.body);
  
  try {
    const { amount, currency = "INR" } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: "Valid amount is required",
        received: amount 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise and round
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };

    console.log("Creating Razorpay order with options:", options);

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created:", order);

    res.json({
      success: true,
      ...order
    });

  } catch (err) {
    console.error("❌ Razorpay Error:", err);
    
    // More detailed error handling
    if (err.error) {
      console.error("Razorpay API Error:", err.error);
    }
    
    res.status(500).json({ 
      error: "Failed to create Razorpay order",
      details: err.error?.description || err.message,
      code: err.error?.code
    });
  }
});

// Payment verification endpoint (optional but recommended)
app.post("/verify-payment", async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  
  const crypto = require("crypto");
  
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");
  
  if (generated_signature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Payment verification failed" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Express server running on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/health`);
  console.log(`💰 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? "Set" : "Missing"}`);
});