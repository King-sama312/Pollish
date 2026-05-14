import "dotenv/config";
import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import pollRoutes from "./modules/polls/polls.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"

function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

 app.use(cors({
  origin: "http://localhost:5173",   
  credentials: true,                
}));
  app.use(cookieParser())
  app.use(express.json());

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  app.get("/health", (req, res) => {
    res.json({ healthy: true });
  });

  app.use("/api/auth", authRoutes)
  app.use("/api/poll", pollRoutes)

}

main();
