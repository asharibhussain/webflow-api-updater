const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const port = 3000;

const WEBFLOW_TOKEN = "your_webflow_token";
const COLLECTION_ID = "your_collection_id";

app.use(cors());
app.use(express.json());

app.post("/update-read-time-by-slug", async (req, res) => {
  const { slug, readTime } = req.body;

  if (!slug || !readTime) {
    return res.status(400).json({ error: "Missing slug or readTime" });
  }

  try {
    // Step 1: Get items from collection
    const listRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_TOKEN}`,
        "accept-version": "1.0.0"
      }
    });

    const listData = await listRes.json();

    const item = listData.items.find(item => item.slug === slug);
    if (!item) {
      return res.status(404).json({ error: "Item not found with that slug" });
    }

    const itemId = item._id;

    // Step 2: Update that item
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
          "read-time": readTime
        }
      })
    });

    const patchData = await patchRes.json();

    if (!patchRes.ok) {
      return res.status(500).json({ error: patchData });
    }

    res.json({ success: true, result: patchData });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
