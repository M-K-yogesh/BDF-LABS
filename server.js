// BDF Lab 01: Node.js and Express server
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const studentDetails = {
  name: "M.K.YOGESH",
  section: "CSE(GAI)-2B",
  regdNumber: "252U1R9085"
};

app.use((request, response, next) => {
  response.on("finish", () => {
    console.log(`${request.method} ${request.originalUrl} -> ${response.statusCode}`);
  });
  next();
});

app.get("/", (request, response) => {
  response.status(200).type("text").send("Welcome to my Node.js and Express server!");
});

app.get("/about", (request, response) => {
  response.status(200).json(studentDetails);
});

app.get("/time", (request, response) => {
  response.status(200).json({
    currentDateTime: new Date().toString(),
    isoDateTime: new Date().toISOString()
  });
});

app.use((request, response) => {
  response.status(404).type("text").send("404 - Page not found");
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
  console.log("Try /, /about, and /time in your browser.");
});
