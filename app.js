import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const app = express();
const PORT = 3000;

app.use(express.json());
// 1. HELMET - Security header
app.use(helmet());

// 2 . CORS - Configure allowed origins
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: "true",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 3. RATE LIMITING - General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

//Strict Rate Limiting for Specific Routes
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many attempts, please slow down.",
});

//Routes for Testing

app.get("/", (req, res) => {
  res.json({
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Test CORS
app.get("/api/data", (req, res) => {
  res.json({
    data: "This endpoint is CORS enabled",
    origin: req.headers.origin || "unknown",
  });
});

// Test Strict Rate Limiting
app.post("/api/login", strictLimiter, (req, res) => {
  const { username , password} = req.body;
  res.json({
    message: "Login attempt recorded",
    username,
    password,
    note: "Try hitting this endpoint 6 times in a minute to see rate limiting in action",
  });
});

// Test helmet headers
app.get('/api/headers', (req, res) => {
  res.json({ 
    message: 'Check the response headers to see Helmet security headers',
    tip: 'Open DevTools > Network tab to inspect headers'
  });
});

// Test general rate limiter
app.get('/api/test-general-limit', (req, res) => {
  res.json({ 
    message: 'Testing general rate limiter (100 req/15min)',
    requestsRemaining: req.rateLimit?.remaining,
    resetTime: new Date(Date.now() + req.rateLimit?.resetTime)
  });
})

app.listen(PORT, () => {
  console.log(`\ Server running on http://localhost:${PORT}`);
  console.log('\n Test endpoints:');
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/api/data`);
  console.log(`   POST http://localhost:${PORT}/api/login`);
  console.log(`   GET  http://localhost:${PORT}/api/headers`);
  console.log(`   GET  http://localhost:${PORT}/api/test-general-limit`);
  console.log('\n Testing tips:');
  console.log('   - Use Postman, curl, or browser DevTools');
  console.log('   - Hit /api/login 6 times quickly to trigger rate limit');
  console.log('   - Check response headers to see Helmet in action');
  console.log('   - Try requests from different origins to test CORS\n');
});