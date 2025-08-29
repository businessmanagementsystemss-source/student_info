const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// -------------------------
// 1️⃣ Create app
// -------------------------
const app = express();

// -------------------------
// 2️⃣ Middleware
// -------------------------
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve front-end

// -------------------------
// 3️⃣ Firebase Admin SDK (use env variable instead of file)
// -------------------------
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);
} catch (err) {
  console.error("❌ Missing or invalid FIREBASE_KEY_JSON env variable");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://student-portal-8e8d3-default-rtdb.firebaseio.com"
});
const db = admin.database();

// -------------------------
// 4️⃣ Simple API for testing
// -------------------------
app.get('/api/test', (req, res) => {
  res.json({ message: "✅ Server is working!" });
});

// -------------------------
// 5️⃣ Serve index.html on /
// -------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------------
// 6️⃣ Register student
// -------------------------
app.post('/api/register', async (req, res) => {
  const { name, reg, email, phone, gender, dob, password } = req.body;

  if (!name || !reg || !email || !phone || !gender || !dob || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await db.ref('students/' + reg).set({ name, email, phone, gender, dob, password });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error registering student:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 7️⃣ Login student
// -------------------------
app.post('/api/login', async (req, res) => {
  const { reg, password } = req.body;

  if (!reg || !password) {
    return res.status(400).json({ error: "Reg & password required" });
  }

  try {
    const snapshot = await db.ref('students/' + reg).get();
    if (!snapshot.exists()) {
      return res.status(404).json({ error: "Registration number not found" });
    }

    const student = snapshot.val();
    if (student.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 8️⃣ Get student results
// -------------------------
app.get('/api/results', async (req, res) => {
  const reg = req.query.reg;
  if (!reg) return res.status(400).json({ error: "Registration number required" });

  console.log("🔎 Fetching results for reg:", reg);

  try {
    const snapshot = await db.ref('results/' + reg).get();

    if (!snapshot.exists()) {
      console.log("⚠️ No results found for reg:", reg);
      return res.status(404).json({ error: "No results found" });
    }

    const data = snapshot.val();

    // Case 1: html directly inside
    if (data.html) return res.json({ success: true, html: data.html });

    // Case 2: recursive search for nested html
    function findHtml(obj) {
      for (let key in obj) {
        if (key === "html") return obj[key];
        if (typeof obj[key] === "object") {
          const result = findHtml(obj[key]);
          if (result) return result;
        }
      }
      return null;
    }

    const htmlValue = findHtml(data);

    if (htmlValue) return res.json({ success: true, html: htmlValue });

    return res.status(500).json({ error: "Result data invalid" });

  } catch (err) {
    console.error("❌ Error fetching results:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 9️⃣ Get ads
// -------------------------
app.get('/api/ads', async (req, res) => {
  try {
    const snapshot = await db.ref('ads').get();
    if (!snapshot.exists()) return res.json({ success: true, ads: [] });

    const ads = Object.values(snapshot.val());
    res.json({ success: true, ads });
  } catch (err) {
    console.error("❌ Error fetching ads:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// 🔟 Start server (use Render port)
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
