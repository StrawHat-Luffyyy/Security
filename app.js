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

// MOCK DATA - 100 sample users
const users = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User${i + 1}`,
  email: `user${i + 1}@example.com`,
  age: Math.floor(Math.random() * 50) + 18,
  city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][
    Math.floor(Math.random() * 5)
  ],
}));
// MOCK DATA - 50 sample products
const products = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 1000) + 10,
  category: ["Electronics", "Clothing", "Books", "Food", "Toys"][
    Math.floor(Math.random() * 5)
  ],
  stock: Math.floor(Math.random() * 100),
}));

//Helper Function
function paginate(array, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  // Total pages
  results.total = array.length;
  results.totalPages = Math.ceil(array.length / limit);
  results.currentPage = page;
  results.limit = limit;
  //Next page
  if (endIndex < array.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }
  // Previous page
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  results.data = array.slice(startIndex, endIndex);

  return results;
}
// ROOT ENDPOINT
app.get("/", (req, res) => {
  res.json({
    message: "Pagination Testing API",
    endpoints: [
      "GET /api/users - Paginated users list",
      "GET /api/products - Paginated products list",
      "GET /api/users/search - Search users with pagination",
      "GET /api/products/filter - Filter products with pagination",
    ],
  });
});
// 1. BASIC PAGINATION - Users
app.get("/api/users", (req, res) => {
  // Get page and limit from query params (with defaults)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate
  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json({ error: "Page and limit must be positive numbers" });
  }

  if (limit > 50) {
    return res.status(400).json({ error: "Limit cannot exceed 50" });
  }

  const result = paginate(users, page, limit);
  res.json(result);
});
// 2. BASIC PAGINATION - Products
app.get("/api/products", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json({ error: "Page and limit must be positive numbers" });
  }

  if (limit > 50) {
    return res.status(400).json({ error: "Limit cannot exceed 50" });
  }

  const result = paginate(products, page, limit);
  res.json(result);
});

// 3. PAGINATION WITH SEARCH
app.get("/api/users/search", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchTerm = req.query.q || "";

  // Filter users by search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const result = paginate(filteredUsers, page, limit);
  result.searchTerm = searchTerm;

  res.json(result);
});

// 4. PAGINATION WITH FILTERS
app.get("/api/products/filter", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const category = req.query.category;
  const minPrice = parseInt(req.query.minPrice) || 0;
  const maxPrice = parseInt(req.query.maxPrice) || Infinity;

  // Filter products
  let filteredProducts = products.filter(
    (product) => product.price >= minPrice && product.price <= maxPrice,
  );

  if (category) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
  }

  const result = paginate(filteredProducts, page, limit);
  result.filters = { category, minPrice, maxPrice };

  res.json(result);
});

// 5. PAGINATION WITH SORTING
app.get("/api/products/sorted", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "id"; // id, name, price
  const order = req.query.order || "asc"; // asc or desc

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "price" || sortBy === "id" || sortBy === "stock") {
      comparison = a[sortBy] - b[sortBy];
    } else {
      comparison = a[sortBy].localeCompare(b[sortBy]);
    }

    return order === "desc" ? -comparison : comparison;
  });

  const result = paginate(sortedProducts, page, limit);
  result.sorting = { sortBy, order };

  res.json(result);
});

// 6. CURSOR-BASED PAGINATION (alternative to offset-based)
app.get("/api/users/cursor", (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cursor = parseInt(req.query.cursor) || 0; // last ID seen

  // Get users after cursor
  const filteredUsers = users.filter((user) => user.id > cursor);
  const paginatedUsers = filteredUsers.slice(0, limit);

  const hasMore = filteredUsers.length > limit;
  const nextCursor =
    paginatedUsers.length > 0
      ? paginatedUsers[paginatedUsers.length - 1].id
      : null;

  res.json({
    data: paginatedUsers,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  });
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
  const { username, password } = req.body;
  res.json({
    message: "Login attempt recorded",
    username,
    password,
    note: "Try hitting this endpoint 6 times in a minute to see rate limiting in action",
  });
});

// Test helmet headers
app.get("/api/headers", (req, res) => {
  res.json({
    message: "Check the response headers to see Helmet security headers",
    tip: "Open DevTools > Network tab to inspect headers",
  });
});

// Test general rate limiter
app.get("/api/test-general-limit", (req, res) => {
  res.json({
    message: "Testing general rate limiter (100 req/15min)",
    requestsRemaining: req.rateLimit?.remaining,
    resetTime: new Date(Date.now() + req.rateLimit?.resetTime),
  });
});
/*
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
*/
// Start server
app.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
  console.log("\n Pagination Test Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/api/users?page=1&limit=10`);
  console.log(`   GET  http://localhost:${PORT}/api/products?page=2&limit=5`);
  console.log(
    `   GET  http://localhost:${PORT}/api/users/search?q=User&page=1&limit=10`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/api/products/filter?category=Electronics&page=1&limit=10`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/api/products/sorted?sortBy=price&order=desc&page=1&limit=10`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/api/users/cursor?cursor=0&limit=10`,
  );
  console.log("\n Query Parameters:");
  console.log("   - page: Page number (default: 1)");
  console.log("   - limit: Items per page (default: 10, max: 50)");
  console.log("   - q: Search term");
  console.log("   - category: Filter by category");
  console.log("   - minPrice/maxPrice: Price range filter");
  console.log("   - sortBy: Sort field (id, name, price, stock)");
  console.log("   - order: Sort order (asc, desc)");
  console.log("   - cursor: Last seen ID (for cursor pagination)\n");
});
