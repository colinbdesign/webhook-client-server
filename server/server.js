const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route handlers
app.get("/", (req, res) => {
  res.send("👋 Webhook server is online!");
});

// Ghost event webhook endpoints
app.post("/webhook/published", triggerGithubWorkflow);
app.post("/webhook/updated", triggerGithubWorkflow);
app.post("/webhook/unpublished", triggerGithubWorkflow);
app.post("/webhook/deleted", triggerGithubWorkflow);

// Trigger GitHub Actions workflow
async function triggerGithubWorkflow(req, res) {
  try {
    const githubToken = process.env.GITHUB_TOKEN; // must be fine-scoped: repo + workflow

    if (!githubToken) {
      console.error("❌ GITHUB_TOKEN not set");
      return res.status(500).send("Server misconfigured: missing GitHub token");
    }

    const repoOwner = "colinbdesign"; // CHANGE THIS
    const repoName = "website-sandbox";      // CHANGE THIS
    const workflowFile = "ghost-deploy.yml"; // .github/workflows/ghost-deploy.yml
    const branchRef = "staging-verc-to-rail-static"; // or "staging-verc-to-rail-static" or whatever Railway is watching

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

    const headers = {
      "Authorization": `token ${githubToken}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "ghost-webhook-deploy-bot"
    };

    const payload = {
      ref: branchRef
    };

    console.log("📤 Sending dispatch to GitHub Actions:", {
      url,
      headers: { ...headers, Authorization: "REDACTED" },
      payload
    });

    const response = await axios.post(url, payload, { headers });

    console.log("✅ GitHub Action triggered successfully");
    res.status(200).send("Triggered GitHub Action");
  } catch (err) {
    console.error("💥 Failed to trigger GitHub Action");
    if (err.response) {
      console.error("📄 Response data:", err.response.data);
      console.error("📊 Status:", err.response.status);
      console.error("📋 Headers:", err.response.headers);
    } else if (err.request) {
      console.error("🔌 No response received:", err.request);
    } else {
      console.error("🧠 Setup error:", err.message);
    }

    res.status(500).send("Failed to trigger GitHub Action");
  }
}

app.listen(port, () => {
  console.log(`🚀 Webhook server running at http://localhost:${port}`);
});