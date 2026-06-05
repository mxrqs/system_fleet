import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "../routers";

const app = express();

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

const port = 3000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
