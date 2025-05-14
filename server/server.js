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

  const graphqlEndpoint = "https://backboard.railway.app/graphql/v2";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${RAILWAY_TOKEN}`
  };

  console.log(`🚨 Received event: ${eventType}`);
  console.log("📦 Payload:", req.body);

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
    res.status(200).send("Redeploy triggered");
  } catch (err) {
    console.error("💥 Error during Railway redeploy:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    res.status(500).send("Error during redeploy");
  }
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
