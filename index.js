require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const port = 3000;

// ✅ Use your actual Webflow token and collection ID from .env
const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;
const COLLECTION_ID = process.env.COLLECTION_ID;

// ✅ Allow only your Webflow live domain
app.use(cors({
  origin: "https://asharibhussain.webflow.io"
}));

app.use(express.json());

app.post("/update-read-time-by-slug", async (req, res) => {
  const { slug, readTime } = req.body;

  // ✅ Validate input
  if (!slug || !readTime) {
    return res.status(400).json({ error: "Missing slug or readTime" });
  }

  try {
    console.log("📥 Received slug:", slug);
    console.log("⏱️ Read time to save:", readTime);

    // ✅ Step 1: Get all items from collection
    const listRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_TOKEN}`,
        "accept-version": "1.0.0"
      }
    });

    const listData = await listRes.json();

    // ✅ Step 2: Find item by slug
    const item = listData.items.find(item => item.slug === slug);
    if (!item) {
      return res.status(404).json({ error: "Item not found with that slug" });
    }

    const itemId = item._id;

    // ✅ Step 3: Update read-time field in Webflow CMS
    const patchRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${itemId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${WEBFLOW_TOKEN}`,
        "accept-version": "1.0.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        isDraft: false,
        isArchived: false,
        fields: {
          "read-time": readTime  // ✅ Make sure field slug is correct
        }
      })
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      return res.status(500).json({ error: patchData });
    }

    console.log("✅ CMS item updated:", patchData);
    res.json({ success: true, result: patchData });

  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
