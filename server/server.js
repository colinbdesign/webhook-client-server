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

app.post("/webhook-1", (req, res) => {
  console.log("Webhook 1 received:");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({
    message: "Webhook 1 successfully received.",
    receivedData: req.body
  });
});

app.post("/webhook-2", (req, res) => {
  console.log("Webhook 2 received:");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({
    message: "Webhook 2 successfully received.",
    receivedData: req.body
  });
});

app.post("/webhook", async (req, res) => {
  const axios = require('axios');

  const RAILWAY_TOKEN = process.env.RAILWAY_API_TOKEN;
  const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
  const ENV_ID = process.env.RAILWAY_ENVIRONMENT_ID;
  const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;

  const allowedEvents = [
    "post.published",
    "post.published.edited",
    "post.unpublished",
    "post.deleted"
  ];

  const ghostEvent = req.get("X-Ghost-Event");
  console.log("📨 Ghost event header:", ghostEvent);
  console.log("🔔 Received Ghost event:", ghostEvent);
  console.log("📦 Full payload:", req.body);

  if (!allowedEvents.includes(ghostEvent)) {
    console.log("⚠️ Event not allowed, skipping.");
    return res.status(200).send("Ignored event.");
  }

  const graphqlEndpoint = 'https://backboard.railway.app/graphql/v2';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${RAILWAY_TOKEN}`
  };

  try {
    const query = {
      query: `
        query ($serviceId: ID!, $environmentId: ID!) {
          service(id: $serviceId) {
            deployments(environmentId: $environmentId, first: 1) {
              edges {
                node {
                  id
                  status
                }
              }
            }
          }
        }
      `,
      variables: {
        serviceId: SERVICE_ID,
        environmentId: ENV_ID
      }
    };

    const queryRes = await axios.post(graphqlEndpoint, query, { headers });
    const latestDeploymentId = queryRes?.data?.data?.service?.deployments?.edges?.[0]?.node?.id;

    if (!latestDeploymentId) {
      console.error("❌ Could not fetch latest deployment ID. Full response:", queryRes.data);
      return res.status(500).send("No deployment ID found");
    }

    console.log("🚀 Latest deployment ID:", latestDeploymentId);

    const mutation = {
      query: `
        mutation ($deploymentId: String!) {
          deploymentRedeploy(id: $deploymentId) {
            id
            status
          }
        }
      `,
      variables: {
        deploymentId: latestDeploymentId
      }
    };

    const redeployRes = await axios.post(graphqlEndpoint, mutation, { headers });
    console.log("✅ Redeploy triggered:", redeployRes.data);
    return res.status(200).send("Redeploy triggered");
  } catch (err) {
    console.error("💥 Error during Railway redeploy:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    return res.status(500).send("Error during redeploy");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
