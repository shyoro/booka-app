import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("rooms/:id", "routes/rooms.$id.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
