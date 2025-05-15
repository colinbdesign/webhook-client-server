const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("👋 Webhook server is online!");
});

app.post("/webhook/published", (req, res) => triggerDeploy("post.published", req, res));
app.post("/webhook/updated", (req, res) => triggerDeploy("post.updated", req, res));
app.post("/webhook/unpublished", (req, res) => triggerDeploy("post.unpublished", req, res));
app.post("/webhook/deleted", (req, res) => triggerDeploy("post.deleted", req, res));

async function triggerDeploy(eventType, req, res) {
  const token = process.env.RAILWAY_API_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const serviceId = process.env.RAILWAY_ASTRO_SERVICE_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

  if (!token || !projectId || !serviceId || !environmentId) {
    console.error("❌ Missing required environment variables");
    return res.status(500).send("Server misconfigured");
  }

  const deployUrl = `https://backboard.railway.app/api/projects/${projectId}/services/${serviceId}/deploy`;

  console.log(`📣 Received Ghost event: ${eventType}`);
  console.log("📦 Webhook payload:", req.body);

  try {
    const response = await axios.post(
      deployUrl,
      { environmentId },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    console.log(`✅ Triggered Railway deploy for ${eventType}`);
    res.status(200).send("Deployment triggered");
  } catch (err) {
    console.error("💥 Error triggering Railway deploy");
    if (err.response) {
      console.error("📄 Response:", err.response.data);
    } else {
      console.error("🛑 Error:", err.message);
    }
    res.status(500).send("Failed to trigger deploy");
  }
}

app.listen(port, () => {
  console.log(`🚀 Webhook server running at http://localhost:${port}`);
});