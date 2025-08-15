import express from "express";
import authRoute from "../modules/auth/auth.route";
import clientAppRoute from "../modules/clientApp/clientApp.route";
import googleAuthRoute from "../modules/googleAuth/googleAuth.route";
import subscriptionRoute from "../modules/subscription/subscription.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/subscription",
    route: subscriptionRoute,
  },
  {
    path: "/app",
    route: clientAppRoute,
  },
  {
    path: "/google",
    route: googleAuthRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
