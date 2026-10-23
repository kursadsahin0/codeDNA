import type { Instrumentation } from "next";
import { logRequestError } from "./src/lib/observability/logger";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  logRequestError(error, {
    method: request.method,
    route: context.routePath,
    routerKind: context.routerKind,
    routeType: context.routeType,
  });
};
