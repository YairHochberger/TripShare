require("dotenv").config({ path: "./.env"});
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const joinRequestRoutes = require("./routes/joinRequestRoutes");
const userRoutes = require("./routes/userRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { UPLOAD_DIR } = require("./middleware/uploadMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Trip photos. Served read-only; nothing here is executed.
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/notifications", notificationRoutes);

// Upload failures (too large, wrong type) arrive here rather than as a
// stack trace, so the client can show something useful.
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "That image is larger than 5 MB" });
  }
  if (err?.message?.includes("images are allowed")) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

console.log("1. Server started");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("2. Mongo connected");

    const port = process.env.PORT || 5050;
    app.listen(port, () => {
      console.log(`3. Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGO FAILED:");
    console.log(err);
  });

