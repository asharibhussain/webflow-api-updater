const express = require("express");
const fetch = require("node-fetch");

const app = express();
const port = 3000;

// Replace these with your actual tokens
const WEBFLOW_TOKEN = "df133e66658bd4fe79aaa2c7608bf45b6f522b4a6a7be7940def75d45b505423";
const COLLECTION_ID = "685d1ba83913d89273584ae9";

app.use(express.json());

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
          "read-time": readTime
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    res.json({ success: true, result: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
