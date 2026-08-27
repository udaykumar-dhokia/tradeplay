import type { Express, RequestHandler } from "express";

const apiBasePath = "/api/v1";

type RouteLayer = {
  route?: {
    path: string | string[];
    methods: Record<string, boolean>;
  };
  handle?: { stack?: RouteLayer[] };
  name?: string;
  path?: string;
};

const mountedRouters = new WeakMap<
  Express,
  Array<{
    path: string;
    router: RequestHandler & { stack?: unknown };
  }>
>();

export function mountApiRouter(
  app: Express,
  path: string,
  router: RequestHandler & { stack?: unknown },
) {
  app.use(path, router);
  const routers = mountedRouters.get(app) ?? [];
  routers.push({ path, router });
  mountedRouters.set(app, routers);
}

function addRoutes(
  stack: RouteLayer[] | undefined,
  basePath: string,
  paths: Record<string, Record<string, object>>,
) {
  for (const layer of stack ?? []) {
    if (layer.route) {
      const routePaths = Array.isArray(layer.route.path)
        ? layer.route.path
        : [layer.route.path];

      for (const routePath of routePaths) {
        const path = `${basePath}${routePath === "/" ? "" : routePath}`.replace(
          /:([^/]+)/g,
          "{$1}",
        );

        if (!path.startsWith(apiBasePath)) {
          continue;
        }

        paths[path] ??= {};
        for (const method of Object.keys(layer.route.methods)) {
          paths[path][method.toLowerCase()] = {
            responses: {
              "200": { description: "Successful response" },
            },
          };
        }
      }
      continue;
    }
  }
}

export function createOpenApiDocument(app: Express) {
  const paths: Record<string, Record<string, object>> = {};

  addRoutes(app.router?.stack as RouteLayer[] | undefined, "", paths);

  for (const mountedRouter of mountedRouters.get(app) ?? []) {
    addRoutes(
      mountedRouter.router.stack as RouteLayer[] | undefined,
      mountedRouter.path,
      paths,
    );
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Tradeplay API",
      version: "1.0.0",
      description: "Automatically generated API documentation.",
    },
    servers: [{ url: "/" }],
    paths,
  };
}
