import { ok, route } from "@/lib/api";

export const GET = route(async (request: Request) => {
  // Reading request data opts this handler out of prerendering under cacheComponents.
  void request.url;
  return ok({ status: "healthy", timestamp: new Date().toISOString() });
});
