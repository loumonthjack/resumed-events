import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import cookieParser from "cookie-parser";

import auth from "./services/auth";
import api from "./services/api";
import { EventType, Pages } from "./pages"

import { ASTRO_CLIENT_DIST_PATH } from "./constants";
import { authValidate } from "./middleware";
import { prisma } from "./services/database";

const router = express.Router();
// used to parse form data (multipart/form-data)
const multerUpload = multer();

router.use(cookieParser());
router.use(auth.sessionLoader());
router.get("/another-dashboard", async (req, res) => {
  // determine role of logged in user
  if (req.session) {
    const { userRoleId } = req.session;
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { Account: true, Role: true },
    });
    if (!userRole) {
      throw new Error("User role not found");
      //return res.send(Pages.NoRolePage);
    }
    if (userRole.Role.name === "ADMINISTRATOR") {
      return res.send(Pages.AdministratorDashboardPage);
    } 
    if (userRole.Role.name === "COMPANY_MANAGER") {
      return res.send(Pages.CompanyManagerDashboardPage);
    }
  }
  return res.send(Pages.CompanyManagerDashboardPage);

});
router.get("/users", async (req, res) => {
  res.send(Pages.AdministratorUsersPage);
})
router.get("/settings",  (req, res) => {
  res.send(Pages.AdministratorSettingsPage);
});
router.get("/billing",  (req, res) => {
  res.send(Pages.AdministratorBillingPage);
});
router.get('/events', async (req, res) => {
  if (req.session) {
    const { userRoleId } = req.session;
    const { type } = req.query;
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { Account: true, Role: true },
    });
    if (!userRole) {
      throw new Error("User role not found");
      //return res.send(Pages.NoRolePage);
    }
    if (userRole.Role.name === "ADMINISTRATOR") {
      if (!type) return res.send(Pages.AdministratorEventsPage(undefined));
      return res.send(Pages.AdministratorEventsPage(type?.toString() as EventType));
    } 
    if (userRole.Role.name === "COMPANY_MANAGER") {
      if (!type) return res.send(Pages.CompanyManagerEventsPage(undefined));
      return res.send(Pages.CompanyManagerEventsPage(type?.toString() as EventType));
    }
  }
  return res.send(Pages.AdministratorEventsPage(undefined));
});
router.get("/logout", authValidate,  auth.logoutHandler());
router.get("/dashboard", authValidate);

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
router.post("/auth/logout", authValidate, auth.logoutHandler());

router.get("/auth/verify", auth.verifyHandler());
router.get("/operations", api.listHandler());
router.get("/operation/:operationName/help", api.helpHandler());
router.post("/operation/:operationName", authValidate, api.adapterHandler('post'));
router.get("/operation/:operationName", api.adapterHandler('get'));

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
