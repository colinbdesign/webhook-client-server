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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
