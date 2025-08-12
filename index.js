const express = require("express");
const fetch = require("node-fetch");

const app = express();
const port = 3000;

// Replace with your actual tokens
const WEBFLOW_TOKEN = "df133e66658bd4fe79aaa2c7608bf45b6f522b4a6a7be7940def75d45b505423";
const COLLECTION_ID = "685d1ba83913d89273584ae9";

// Use your actual field API ID for read time (check Webflow CMS settings)
const READ_TIME_FIELD = "read-time"; // Change if your field API ID is different
const SLUG_FIELD = "slug"; // Usually 'slug', but check your CMS field API ID

app.use(express.json());

// Update read time by itemId (existing endpoint)
app.post("/update-read-time", async (req, res) => {
  const { itemId, readTime } = req.body;

  if (!itemId || !readTime) {
    return res.status(400).json({ error: "Missing itemId or readTime" });
  }

  try {
    const response = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${itemId}`, {
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
          [READ_TIME_FIELD]: readTime
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Webflow API error:", data);
      return res.status(response.status).json({ error: data });
    }

    res.json({ success: true, result: data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update read time by slug (new endpoint)
app.post("/update-read-time-by-slug", async (req, res) => {
  const { slug, readTime } = req.body;

  if (!slug || !readTime) {
    return res.status(400).json({ error: "Missing slug or readTime" });
  }

  try {
    // 1. Get all items in the collection (could be paginated for large collections)
    const itemsRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items?limit=100`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_TOKEN}`,
        "accept-version": "1.0.0"
      }
    });
    const itemsData = await itemsRes.json();

    if (!itemsRes.ok) {
      console.error("Webflow API error (fetch items):", itemsData);
      return res.status(itemsRes.status).json({ error: itemsData });
    }

    // 2. Find the item with the matching slug
    const item = itemsData.items.find(i => i[SLUG_FIELD] === slug);

    if (!item) {
      return res.status(404).json({ error: "Item not found for slug: " + slug });
    }

    // 3. Update the read time field
    const updateRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${item._id}`, {
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
          [READ_TIME_FIELD]: readTime
        }
      })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.error("Webflow API error (update):", updateData);
      return res.status(updateRes.status).json({ error: updateData });
    }

    res.json({ success: true, result: updateData });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});