# Express Security Middleware Testing Guide

## 📦 Installation

```bash
npm init -y
npm install express express-rate-limit helmet cors
```

## 🚀 Running the Server

```bash
node server.js
```

Server will start on `http://localhost:3000`

---

## 🧪 Testing Commands

### 1. **Basic Server Test**

```bash
# Check if server is running
curl http://localhost:3000/
```

**Expected Response:**

```json
{
  "message": "Server is running!",
  "timestamp": "2026-01-19T..."
}
```

---

### 2. **Testing HELMET (Security Headers)**

```bash
# View all security headers
curl -I http://localhost:3000/api/headers
```

**What to look for in headers:**

- `X-DNS-Prefetch-Control: off`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=15552000; includeSubDomains`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies: none`

**Alternative (full response with headers):**

```bash
curl -v http://localhost:3000/api/headers
```

---

### 3. **Testing RATE LIMITING**

#### **General Rate Limiter (100 requests/15 minutes)**

```bash
# Check current rate limit status
curl http://localhost:3000/api/test-general-limit
```

**Expected Response:**

```json
{
  "message": "Testing general rate limiter (100 req/15min)",
  "requestsRemaining": 99,
  "resetTime": "..."
}
```

#### **Strict Rate Limiter (5 requests/minute)**

```bash
# Run this command 6 times quickly to trigger rate limit
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123"}'
```

**On 6th request, you'll get:**

```json
{
  "message": "Too many attempts, please slow down!"
}
```

**Quick test script (Bash/Linux/Mac):**

```bash
# Hit the endpoint 6 times
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"123"}'
  echo -e "\n"
done
```

**Windows PowerShell:**

```powershell
for ($i=1; $i -le 6; $i++) {
  Write-Host "Request $i:"
  curl -X POST http://localhost:3000/api/login `
    -H "Content-Type: application/json" `
    -d '{\"username\":\"test\",\"password\":\"123\"}'
  Write-Host ""
}
```

---

### 4. **Testing CORS**

#### **Important Note:**

CORS is enforced by **browsers only**, not by curl. To truly test CORS, you need to use a browser.

#### **Using curl (shows server response, but doesn't enforce CORS):**

```bash
# Request from allowed origin
curl -X GET http://localhost:3000/api/data \
  -H "Origin: http://localhost:3000"

# Request from blocked origin (curl will still get response)
curl -X GET http://localhost:3000/api/data \
  -H "Origin: http://example.com"
```

#### **Proper CORS Testing (Browser-based):**

**Option 1: Create HTML file**

Create `test-cors.html`:

```html
<!DOCTYPE html>
<html>
  <body>
    <h1>CORS Test</h1>
    <button onclick="testCORS()">Test CORS Request</button>
    <div id="result"></div>

    <script>
      async function testCORS() {
        try {
          const response = await fetch("http://localhost:3000/api/data");
          const data = await response.json();
          document.getElementById("result").innerHTML =
            `<p style="color: green"> Success: ${JSON.stringify(data)}</p>`;
        } catch (error) {
          document.getElementById("result").innerHTML =
            `<p style="color: red"> CORS Error: ${error.message}</p>`;
        }
      }
    </script>
  </body>
</html>
```

**Testing steps:**

1. Serve this HTML on a different port (e.g., using Python):

   ```bash
   # In the same directory as test-cors.html
   python -m http.server 8080
   # OR
   python3 -m http.server 8080
   ```

2. Open `http://localhost:8080/test-cors.html` in your browser
3. Click the button
4. Check browser DevTools Console - you'll see CORS error because `http://localhost:8080` is not in allowed origins

**Option 2: Browser DevTools Console**

1. Open `http://localhost:3000` in your browser
2. Open DevTools (F12) → Console tab
3. Run this:
   ```javascript
   fetch("http://localhost:3000/api/data")
     .then((res) => res.json())
     .then((data) => console.log("✅ Success:", data))
     .catch((err) => console.error("❌ Error:", err));
   ```

**Option 3: Using Postman/Thunder Client**

1. Make a GET request to `http://localhost:3000/api/data`
2. Postman will show the response (it doesn't enforce CORS)
3. But check the `Access-Control-Allow-Origin` header in the response

---

## 📊 Using Postman/Thunder Client

### Rate Limiting Test:

1. Create a POST request to `http://localhost:3000/api/login`
2. Set Header: `Content-Type: application/json`
3. Set Body (raw JSON):
   ```json
   {
     "username": "test",
     "password": "123"
   }
   ```
4. Click "Send" rapidly 6 times
5. 6th request will return rate limit error

### Helmet Test:

1. Make any GET request
2. Go to "Headers" tab in response
3. Look for security headers (X-Frame-Options, etc.)

### CORS Test:

1. Make GET request to `http://localhost:3000/api/data`
2. Check response header: `Access-Control-Allow-Origin`
3. Note: Postman doesn't enforce CORS, so requests will succeed

---

## 🎯 Quick Testing Checklist

- [ ] Server starts without errors
- [ ] Basic endpoint responds (`/`)
- [ ] Helmet adds security headers (`curl -I`)
- [ ] Rate limiter blocks after 5 login attempts
- [ ] General rate limiter tracks remaining requests
- [ ] CORS allows localhost:3000 and localhost:5173
- [ ] CORS blocks other origins (test in browser)

---

## 🐛 Troubleshooting

**Rate limit not resetting:**

- Restart the server (rate limits are in-memory)

**CORS not blocking:**

- Remember: curl doesn't enforce CORS, test in a browser

**Headers not showing:**

- Use `curl -I` or `curl -v` to see headers

**Can't install packages:**

- Make sure you're in the project directory
- Try `npm install` again

---

## 📚 Additional Resources

- [Express Rate Limit Docs](https://www.npmjs.com/package/express-rate-limit)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [CORS Docs](https://www.npmjs.com/package/cors)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)


# Express Pagination Testing Guide

## 📦 Setup

The server includes 100 mock users and 50 mock products for testing pagination.

```bash
node .js
```

---

## 🧪 Testing Commands

### 1. **Basic Pagination - Users**

```bash
# Get first page (10 users)
curl "http://localhost:3000/api/users"

# Get page 2 with 10 users
curl "http://localhost:3000/api/users?page=2&limit=10"

# Get page 1 with 20 users
curl "http://localhost:3000/api/users?page=1&limit=20"

# Get last page
curl "http://localhost:3000/api/users?page=10&limit=10"
```

**Expected Response:**
```json
{
  "total": 100,
  "totalPages": 10,
  "currentPage": 1,
  "limit": 10,
  "next": {
    "page": 2,
    "limit": 10
  },
  "data": [
    {
      "id": 1,
      "name": "User 1",
      "email": "user1@example.com",
      "age": 25,
      "city": "New York"
    }
    // ... 9 more users
  ]
}
```

---

### 2. **Basic Pagination - Products**

```bash
# Get first page of products
curl "http://localhost:3000/api/products"

# Get page 2 with 5 products
curl "http://localhost:3000/api/products?page=2&limit=5"

# Get page 3 with 15 products
curl "http://localhost:3000/api/products?page=3&limit=15"
```

---

### 3. **Pagination with Search**

```bash
# Search for "User 1" (will match User 1, User 10, User 11, etc.)
curl "http://localhost:3000/api/users/search?q=User%201"

# Search with pagination
curl "http://localhost:3000/api/users/search?q=User&page=1&limit=5"

# Search by city
curl "http://localhost:3000/api/users/search?q=Tokyo&page=1&limit=10"

# Search by email
curl "http://localhost:3000/api/users/search?q=user1&page=1&limit=10"
```

**Response includes search term:**
```json
{
  "total": 20,
  "totalPages": 4,
  "currentPage": 1,
  "limit": 5,
  "searchTerm": "User",
  "next": { "page": 2, "limit": 5 },
  "data": [ /* matching users */ ]
}
```

---

### 4. **Pagination with Filters**

```bash
# Filter by category
curl "http://localhost:3000/api/products/filter?category=Electronics"

# Filter by price range
curl "http://localhost:3000/api/products/filter?minPrice=100&maxPrice=500"

# Combine category and price filter with pagination
curl "http://localhost:3000/api/products/filter?category=Electronics&minPrice=100&maxPrice=500&page=1&limit=5"

# All categories available: Electronics, Clothing, Books, Food, Toys
curl "http://localhost:3000/api/products/filter?category=Books&page=1&limit=10"
```

**Response includes filters:**
```json
{
  "total": 15,
  "totalPages": 3,
  "currentPage": 1,
  "limit": 5,
  "filters": {
    "category": "Electronics",
    "minPrice": 100,
    "maxPrice": 500
  },
  "data": [ /* filtered products */ ]
}
```

---

### 5. **Pagination with Sorting**

```bash
# Sort by price (ascending)
curl "http://localhost:3000/api/products/sorted?sortBy=price&order=asc"

# Sort by price (descending)
curl "http://localhost:3000/api/products/sorted?sortBy=price&order=desc&page=1&limit=10"

# Sort by name
curl "http://localhost:3000/api/products/sorted?sortBy=name&order=asc&page=1&limit=10"

# Sort by stock
curl "http://localhost:3000/api/products/sorted?sortBy=stock&order=desc&page=1&limit=5"

# Sort by ID (descending) - newest first
curl "http://localhost:3000/api/products/sorted?sortBy=id&order=desc"
```

**Available sortBy fields:** `id`, `name`, `price`, `stock`

---

### 6. **Cursor-Based Pagination**

Cursor-based pagination is better for real-time data and large datasets.

```bash
# Get first 10 users (cursor starts at 0)
curl "http://localhost:3000/api/users/cursor?cursor=0&limit=10"

# Get next 10 users (use nextCursor from previous response)
curl "http://localhost:3000/api/users/cursor?cursor=10&limit=10"

# Get next 10 users
curl "http://localhost:3000/api/users/cursor?cursor=20&limit=10"

# Custom limit
curl "http://localhost:3000/api/users/cursor?cursor=0&limit=25"
```

**Response format:**
```json
{
  "data": [ /* users */ ],
  "nextCursor": 10,
  "hasMore": true
}
```

When `hasMore: false`, you've reached the end.

---

## 🎯 Edge Cases to Test

### Invalid Page Numbers
```bash
# Page 0 (should error)
curl "http://localhost:3000/api/users?page=0&limit=10"

# Negative page (should error)
curl "http://localhost:3000/api/users?page=-1&limit=10"

# Page beyond total pages (returns empty data)
curl "http://localhost:3000/api/users?page=999&limit=10"
```

### Limit Validation
```bash
# Limit of 0 (should error)
curl "http://localhost:3000/api/users?page=1&limit=0"

# Limit exceeding max (should error - max is 50)
curl "http://localhost:3000/api/users?page=1&limit=100"

# Valid max limit
curl "http://localhost:3000/api/users?page=1&limit=50"
```

### Empty Results
```bash
# Search with no matches
curl "http://localhost:3000/api/users/search?q=NonexistentUser"

# Filter with no matches
curl "http://localhost:3000/api/products/filter?category=InvalidCategory"
```

---

## 📊 Using Postman/Thunder Client

### Test Basic Pagination:
1. **Request:** `GET http://localhost:3000/api/users`
2. **Params:**
   - `page`: 1
   - `limit`: 10
3. Click Send and observe the response

### Test Navigation:
1. Note the `next.page` value in the response
2. Create a new request with `page=2`
3. Verify `previous.page` exists in the response

### Test Search:
1. **Request:** `GET http://localhost:3000/api/users/search`
2. **Params:**
   - `q`: Tokyo
   - `page`: 1
   - `limit`: 5

### Test Filters:
1. **Request:** `GET http://localhost:3000/api/products/filter`
2. **Params:**
   - `category`: Electronics
   - `minPrice`: 100
   - `maxPrice`: 500
   - `page`: 1
   - `limit`: 10

---

## 🧮 Quick Testing Script (Bash)

```bash
#!/bin/bash

echo "Testing Pagination..."

echo -e "\n1. Basic pagination (page 1):"
curl -s "http://localhost:3000/api/users?page=1&limit=5" | jq '.currentPage, .totalPages, (.data | length)'

echo -e "\n2. Basic pagination (page 2):"
curl -s "http://localhost:3000/api/users?page=2&limit=5" | jq '.currentPage, .totalPages'

echo -e "\n3. Search pagination:"
curl -s "http://localhost:3000/api/users/search?q=User%201&limit=5" | jq '.total, .searchTerm, (.data | length)'

echo -e "\n4. Filter pagination:"
curl -s "http://localhost:3000/api/products/filter?category=Electronics&limit=5" | jq '.total, .filters'

echo -e "\n5. Sorted pagination:"
curl -s "http://localhost:3000/api/products/sorted?sortBy=price&order=desc&limit=5" | jq '.sorting, (.data[0].price), (.data[-1].price)'

echo -e "\n6. Cursor pagination:"
curl -s "http://localhost:3000/api/users/cursor?cursor=0&limit=5" | jq '.hasMore, .nextCursor'

echo -e "\nDone!"
```

Save as `test-pagination.sh`, make executable with `chmod +x test-pagination.sh`, then run `./test-pagination.sh`

---

## 💡 Key Concepts

### Offset-based vs Cursor-based Pagination

**Offset-based (page/limit):**
- ✅ Easy to implement
- ✅ Jump to any page
- ❌ Performance issues with large datasets
- ❌ Data inconsistency if records are added/deleted

**Cursor-based:**
- ✅ Better performance for large datasets
- ✅ Consistent results even with data changes
- ❌ Can't jump to arbitrary pages
- ❌ Slightly more complex

---

## 🎯 Testing Checklist

- [ ] Basic pagination works (page & limit)
- [ ] Navigation links (next/previous) are correct
- [ ] Search with pagination returns filtered results
- [ ] Filters combine with pagination correctly
- [ ] Sorting works with pagination
- [ ] Cursor pagination returns correct nextCursor
- [ ] Invalid page numbers return proper errors
- [ ] Limit validation works (max 50)
- [ ] Empty search/filter results handled correctly
- [ ] Total pages calculation is accurate

---

## 🐛 Common Issues

**Empty data on valid page:**
- Check if page number exceeds totalPages

**Wrong total count:**
- Ensure filters/search are applied before counting

**Missing next/previous:**
- First page has no `previous`
- Last page has no `next`

**Performance slow:**
- Consider cursor-based pagination for large datasets
- Add database indexing (when using real DB)