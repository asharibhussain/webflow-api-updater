require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;
const COLLECTION_ID = process.env.COLLECTION_ID;

app.use(cors());
app.use(express.json());

// Helper to calculate read time
function calculateReadTime(text, imageCount = 0) {
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 250;
  const secondsPerImage = 10;
  const totalSeconds = (words / wordsPerMinute) * 60 + (imageCount * secondsPerImage);
  const totalMinutes = Math.floor(totalSeconds / 60);

  return totalSeconds < 60
    ? "Less than 1 minute"
    : totalMinutes === 1
    ? "1 minute"
    : `${totalMinutes} minutes`;
}

// Endpoint to batch update read times
app.post("/update-all-read-times", async (req, res) => {
  try {
    const listRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_TOKEN}`,
        "accept-version": "1.0.0"
      }
    });

    const listData = await listRes.json();

    if (!listData.items) {
      return res.status(500).json({ error: "Failed to retrieve items" });
    }

    const updates = await Promise.all(
      listData.items.map(async item => {
        const body = item["post-body"]; // Your CMS field slug for the blog content
        const images = (body.match(/<img /g) || []).length;
        const readTime = calculateReadTime(body.replace(/<[^>]+>/g, ''), images);

        const updateRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${item._id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${WEBFLOW_TOKEN}`,
            "accept-version": "1.0.0",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            isArchived: false,
            isDraft: false,
            fields: {
              "read-time": readTime
            }
          })
        });

        const result = await updateRes.json();
        return result;
      })
    );

    res.json({ success: true, updated: updates.length });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});





// require('dotenv').config();
// const express = require("express");
// const cors = require("cors");
// const fetch = require("node-fetch");

// const app = express();
// const port = process.env.PORT || 3000;

// const WEBFLOW_TOKEN = process.env.WEBFLOW_TOKEN;
// const COLLECTION_ID = process.env.COLLECTION_ID;

// app.use(cors({
//   origin: "https://asharibhussain.webflow.io"
// }));
// app.use(express.json());

// app.post("/update-read-time-by-slug", async (req, res) => {
//   const { slug, readTime } = req.body;

//   if (!slug || !readTime) {
//     return res.status(400).json({ error: "Missing slug or readTime" });
//   }

//   try {
//     // Step 1: Get all items
//     const listRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
//       headers: {
//         Authorization: `Bearer ${WEBFLOW_TOKEN}`,
//         "accept-version": "1.0.0"
//       }
//     });

//     const listData = await listRes.json();

//     const item = listData.items.find(item => item.slug === slug);
//     if (!item) {
//       return res.status(404).json({ error: "Item not found with that slug" });
//     }

//     const itemId = item._id;

//     // Step 2: Update item
//     const patchRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${itemId}`, {
//       method: "PATCH",
//       headers: {
//         Authorization: `Bearer ${WEBFLOW_TOKEN}`,
//         "accept-version": "1.0.0",
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         isDraft: false,
//         isArchived: false,
//         fields: {
//           "read-time": readTime
//         }
//       })
//     });

//     const patchData = await patchRes.json();

//     if (!patchRes.ok) {
//       return res.status(500).json({ error: patchData });
//     }

//     res.json({ success: true, result: patchData });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`🚀 Server is running on http://localhost:${port}`);
// });
