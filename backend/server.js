import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { word } from "./src/word.js";
import apiRoutes from "./routes/apiRoutes.js";
import bookmarkRouter from "./routes/bookmarkRoutes.js"
import search from "./routes/searchWord.js"
import searchRoutes from "./routes/searchRoutes.js";
import random from "./routes/random.js"
import accountRoutes from "./routes/accountRoutes.js"

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
}));
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.use("/word", search)
app.use("/bookmark", bookmarkRouter)
app.use("/api", apiRoutes);
app.use("/search", searchRoutes);
app.use("/random-word", random)
app.use("/account", accountRoutes)


app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.get("/test", (req, res) => {
  console.log(req);
  res.send(word);
});

app.listen(PORT, () => {
  console.log("Server is listening on PORT:", PORT);
});
