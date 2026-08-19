import express, { type Request, type Response } from "express";
import cors from "cors";
import http from "http";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  return res.status(StatusCodes.OK).json({ message: ReasonPhrases.OK });
});

server.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
