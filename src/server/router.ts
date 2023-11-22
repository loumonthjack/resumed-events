import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import cookieParser from "cookie-parser";

import auth from "./services/auth";
import api from "./services/api";

import { ASTRO_CLIENT_DIST_PATH } from "./constants";
import { requireAuth } from "./middleware";

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

router.post(
  "/auth/signup",
  redirect('/dashboard', (req) => Boolean(req.session)),
  multerUpload.single('profilePicture'),
  auth.signupHandler()
)
router.get("/auth/invite",
  auth.inviteHandler()
);
router.post("/auth/logout", requireAuth, auth.logoutHandler());

router.get("/auth/verify", auth.verifyHandler());
router.get("/operations", api.listHandler());
router.get("/operation/:operationName/help", api.helpHandler());
router.post("/operation/:operationName", requireAuth, api.adapterHandler());

/* NETWORKING ROUTES */
// router.use(networkingRoute);

/* STATIC ROUTES */
router.use(express.static(ASTRO_CLIENT_DIST_PATH));

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
