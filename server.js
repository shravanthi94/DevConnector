const express = require("express");
const connectDB = require("./config/db");

const app = express();

//connect to the database
connectDB();

app.get("/", (req, res) => {
  res.send("app running successfully");
});

//API routes for GET
app.use("/api/users", require("./routers/api/users"));
app.use("/api/auth", require("./routers/api/auth"));
app.use("/api/profile", require("./routers/api/profile"));
app.use("/api/posts", require("./routers/api/posts"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`App started running on ${PORT}`));
