import type { Application } from "express";

declare module "express-list-endpoints" {
  export type RouteDefinition = {
    path: string;
    methods: string[];
    middlewares: string[];
  };

  export default function listEndpoints(app: Application): RouteDefinition[];
}
