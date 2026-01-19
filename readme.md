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
