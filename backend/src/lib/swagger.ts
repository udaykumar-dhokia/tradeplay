import type { Express } from "express";
import swaggerJsdoc from "swagger-jsdoc";

export function createOpenApiDocument(app: Express) {
  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Tradeplay API",
        version: "1.0.0",
        description: "API documentation for Tradeplay",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "access_token",
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
    apis: ["./src/features/**/*.route.ts", "./src/features/**/*.controller.ts"],
  };

  return swaggerJsdoc(options);
}

export function mountApiRouter(app: Express, path: string, router: any) {
  app.use(path, router);
}
