const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handler
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  res.status(500).send("Internal Server Error");
});

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Webhook Server!");
});

app.post("/webhook/published", async (req, res) => {
  await handleGhostEvent("post.published", req, res);
});

app.post("/webhook/updated", async (req, res) => {
  await handleGhostEvent("post.published.edited", req, res);
});

app.post("/webhook/unpublished", async (req, res) => {
  await handleGhostEvent("post.unpublished", req, res);
});

app.post("/webhook/deleted", async (req, res) => {
  await handleGhostEvent("post.deleted", req, res);
});

async function handleGhostEvent(eventType, req, res) {
  const axios = require("axios");
  const RAILWAY_TOKEN = process.env.RAILWAY_API_TOKEN;
  const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
  const ENV_ID = process.env.RAILWAY_ENVIRONMENT_ID;
  const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;

  // Log environment variable availability (sanitized)
  console.log("🔑 Environment check:", {
    hasToken: !!RAILWAY_TOKEN,
    tokenLength: RAILWAY_TOKEN ? RAILWAY_TOKEN.length : 0,
    hasProjectID: !!PROJECT_ID,
    projectIDLength: PROJECT_ID ? PROJECT_ID.length : 0,
    hasEnvID: !!ENV_ID,
    envIDLength: ENV_ID ? ENV_ID.length : 0,
    hasServiceID: !!SERVICE_ID,
    serviceIDLength: SERVICE_ID ? SERVICE_ID.length : 0
  });

  console.log(`🚨 Received event: ${eventType}`);
  console.log("📦 Payload:", req.body);

  try {
    // Try using Railway's REST API instead of GraphQL
    // First get the latest deployment
    const railwayApiUrl = "https://backboard.railway.app/api/projects";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RAILWAY_TOKEN}`
    };

    console.log("📝 Attempting deployment with Railway CLI approach");
    
    // Directly trigger a new deployment using simpler endpoint
    const deployUrl = `${railwayApiUrl}/${PROJECT_ID}/services/${SERVICE_ID}/deploy`;
    console.log("🚀 Deploy URL:", deployUrl);
    
    const deployRes = await axios.post(deployUrl, {
      environmentId: ENV_ID
    }, { 
      headers,
      timeout: 15000 
    });
    
    console.log("📬 Deploy response status:", deployRes.status);
    console.log("✅ Deployment triggered:", deployRes.data);
    res.status(200).send("Deployment triggered successfully");
  } catch (err) {
    console.error("💥 Error during Railway redeploy:");
    
    // Log more detailed error information
    if (err.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error("📄 Response data:", err.response.data);
      console.error("📊 Response status:", err.response.status);
      console.error("📋 Response headers:", err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.error("🔄 Request made but no response received:", err.request);
    } else {
      // Something happened in setting up the request
      console.error("🛑 Error setting up request:", err.message);
    }
    
    console.error("Stack trace:", err.stack);
    res.status(500).send("Error during redeploy");
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
