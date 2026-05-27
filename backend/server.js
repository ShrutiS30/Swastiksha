const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "Swastiksha Secure Backend is active and healthy."
  });
});

app.listen(PORT, () => {
  console.log(`Swastiksha Secure Backend is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
