require("dotenv").config({ path: "./.env"});
console.log("ENV CHECK:", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);

console.log("1. Server started");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("2. Mongo connected");

    app.listen(5000, () => {
      console.log("3. Server running on port 5000");
    });
  })
  .catch((err) => {
    console.log("MONGO FAILED:");
    console.log(err);
  });

