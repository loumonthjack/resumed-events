import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import cookieParser from "cookie-parser";

import auth from "./services/auth";

import { ASTRO_CLIENT_DIST_PATH, NODE_ENV } from "./constants";

const router = express.Router();

// used to parse form data (multipart/form-data)
const multerUpload = multer();

router.use(cookieParser());
router.use(auth.sessionLoader());

/* AUTHENTICATION ROUTES */
// NOTE moved auth routes behind /auth/* so GET reqs dont accidentally conflict w/ astro
router.post(
  "/auth/login",
  redirect("/dashboard", (req) => Boolean(req.session)),
  multerUpload.none(),
  auth.loginHandler()
);

router.get("/auth/verify", auth.verifyHandler());

/* NETWORKING ROUTES */
// router.use(networkingRoute);

/* STATIC ROUTES */
if (NODE_ENV === "production") {
  router.use(express.static(ASTRO_CLIENT_DIST_PATH));
}

// TODO astro ssr
// router.use((req, res, next) => {
//   const locals = {};
//   astroServer.handler(req, res, next, locals);
// });

export default router;

// middleware functions

function redirect(route: string, predicate?: (req: Request) => boolean) {
  return function (req: Request, res: Response, next: NextFunction) {
    if (!predicate || predicate(req)) {
      return res.redirect(route);
    }
    return next();
  };
}
