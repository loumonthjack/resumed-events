import { FULL_SERVER_URL } from "./constants";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import BaseLayout from "./pages/components/base";
export type EventType = "UPCOMING" | "ACTIVE" | "ARCHIVED";
const AdministratorOptions = (eventType?: EventType) => {
  return {
    Dashboard: {
      name: "Dashboard",
      page: Dashboard(), //[{ cards: Cards.getMultiple([Cards.UpcomingEvents, Cards.ActiveUsers, Cards.ActiveEvents, Cards.AttendeesCount, Cards.EventScanCount, Cards.PendingInvites, Cards.PendingUsers]) }],
    },
    Events: {
      name: "Events",
      page: Events(eventType || "upcoming"),//[{ search: "searchEvents", tabs: [{ name: "Upcoming", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=upcoming", create: "/operation/createEvent", edit: "/operation/updateEvent", delete: "/operation/deleteEvent" } } }, { name: "Active", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=active", edit: "/operation/updateEvent" } } }, { name: "Archived", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=archived" } } }] }],
    },
    Users: {
      name: "Users",
      page: Users(),//[{ search: "searchUsers", tabs: [{ name: "Users", table: { columns: ["Name", "Email", "Role", "Status"], button: { get: "/operation/getUsers", create: "/operation/createInvite", edit: "/operation/updateUserRole", delete: "/operation/deleteUser" } } }] }],
    },
    Billing: {
      name: "Billing",
      page: '',//[{ tabs: [{ name: "Billing", table: { columns: ["Company", "Plan", "Status", "NextBillingDate"] }, button: { get: "/operation/getBillingHistory" } }] }],
    },
    Settings: {
      name: "Settings",
      page: Settings(),//[{ tabs: [{ name: "Settings", cards: Cards.getMultiple([Cards.Profile, Cards.Company, Cards.Notifications]) }] }],
    }
  }
}

const CompanyManagerOptions = (eventType?: EventType) => {
  return {
    Dashboard: {
      name: "Dashboard",
      page: Dashboard(), //[{ cards: Cards.getMultiple([Cards.UpcomingEvents, Cards.ActiveUsers, Cards.ActiveEvents, Cards.AttendeesCount, Cards.EventScanCount, Cards.PendingInvites, Cards.PendingUsers]) }],
    },
    Events: {
      name: "Events",
      page: Events(eventType || "upcoming"), //[{ search: "searchEvents", tabs: [{ name: "Upcoming", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=upcoming", create: "/operation/createEvent", edit: "/operation/updateEvent", delete: "/operation/deleteEvent" } } }, { name: "Active", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=active", edit: "/operation/updateEvent" } } }, { name: "Archived", table: { columns: ["Name", "AttendeeCount", "Date", "Time", "Status", "Settings"], button: { get: "/operation/getEvents?filter=archived" } } }] }],
    },
    Users: {
      name: "Users",
      page: Users() //[{ search: "searchUsers", tabs: [{ name: "Users", table: { columns: ["Name", "Email", "Role", "Status"], button: { get: "/operation/getUsers", create: "/operation/createInvite", edit: "/operation/updateUserRole", delete: "/operation/deleteUser" } } }] }],
    },
    Settings: {
      name: "Settings",
      page: '' //[{ tabs: [{ name: "Settings", cards: Cards.getMultiple([Cards.Profile, Cards.Company, Cards.Notifications]) }] }],
    }
  }
}


const AdministratorDashboardPage = BaseLayout(AdministratorOptions().Dashboard)
const AdministratorEventsPage = (eventType?: EventType) => BaseLayout(AdministratorOptions(eventType).Events)
const AdministratorUsersPage = BaseLayout(AdministratorOptions().Users)
const AdministratorBillingPage = BaseLayout(AdministratorOptions().Billing)
const AdministratorSettingsPage = BaseLayout(AdministratorOptions().Settings)

const CompanyManagerDashboardPage = BaseLayout(CompanyManagerOptions().Dashboard)
const CompanyManagerEventsPage = (eventType?: EventType) => BaseLayout(CompanyManagerOptions(eventType).Events)
const CompanyManagerUsersPage = BaseLayout(CompanyManagerOptions().Users)
const CompanyManagerSettingsPage = BaseLayout(CompanyManagerOptions().Settings)

export const Pages = {
  AdministratorDashboardPage,
  AdministratorEventsPage,
  AdministratorUsersPage,
  AdministratorBillingPage,
  AdministratorSettingsPage,
  CompanyManagerDashboardPage,
  CompanyManagerEventsPage,
  CompanyManagerUsersPage,
  CompanyManagerSettingsPage,
}


