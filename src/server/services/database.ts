import { Account, Invite, InviteStatus, Event, Notification, PrismaClient, RoleType, User, EventConfiguration, UserRole, Configuration } from "@prisma/client";
import { createId as cuid } from "@paralleldrive/cuid2";
import mailer from "./mailer";
import { capitalizeName, getRoleName } from "../../helper";
import { FULL_SERVER_URL } from "../constants";
import { JsonObject } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

export { prisma };

// roles
// userRoles
// sessions
// accounts
// users
// invites
// subscriptions
// configurations
// alerts
// notifications

async function removeUserRole(userId: string, userRoleId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: userId,
    },
  });
  if (userRoles.length === 1) {
    throw new Error("Cannot remove last role");
  }
  const userRole = await prisma.userRole.findUnique({
    where: {
      id: userRoleId,
    },
  });
  if (!userRole) {
    throw new Error("Failed to find user role");
  }
  if (userRole.isDefault) {
    const otherRole = userRoles.find((userRole) => userRole.id !== userRoleId);
    if (!otherRole) {
      return await prisma.userRole.delete({
        where: {
          id: userRoleId,
        },
      });
    }
    await prisma.userRole.update({
      where: {
        id: otherRole.id,
      },
      data: {
        isDefault: true,
      },
    });
  }
  return await prisma.userRole.delete({
    where: {
      id: userRoleId,
    },
  });
}
async function createUserRole(userId: string, roleId: string, accountId: string, eventId?: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { 
      userId: userId,
    },
  });

  const defaultRole = userRoles.length > 0 && userRoles.find((userRole) => userRole.isDefault);
  return await prisma.userRole.create({
    data: {
      id: `usr_rol_${cuid()}`,
      userId: userId,
      roleId: roleId,
      isDefault: defaultRole && defaultRole.isDefault ? false : true,
      accountId: accountId,
      eventId: eventId || undefined,
      createdAt: new Date(),
    },
  });
}
async function createNotification(notification: Omit<Notification, "id" | "createdAt" | "updatedAt">, userType?: RoleType, userId?: User["id"]) {
  return await prisma.$transaction(async (prisma) => {
    const notify = await prisma.notification.create({
      data: {
        ...notification,
        id: `ntf_${cuid()}`,
        createdAt: new Date(),
      },
    });
    if (userId) {
      const alert = await prisma.alert.create({
        data: {
          id: `alt_${cuid()}`,
          userId: userId,
          hasRead: false,
          notificationId: notify.id,
          createdAt: new Date(),
        },
      });
      return alert;
    }

    let byUserType;
    if (userType) {
      byUserType = {
        where: {
          UserRole: {
            some: {
              Role: {
                name: userType,
              },
            },
          },
        },
      }
    }

    const users = await prisma.user.findMany(byUserType);
    const alerts = users.map((user) => {
      return {
        id: `alt_${cuid()}`,
        userId: user.id,
        hasRead: false,
        notificationId: notify.id,
        createdAt: new Date(),

      };
    });
    await prisma.alert.createMany({
      data: alerts,
    });
  });
}
async function createRoles() {
  return await prisma.$transaction(async (prisma) => {
    await prisma.role.create({
      data: {
        id: `rol_${cuid()}`,
        name: RoleType.ADMINISTRATOR,
        permissions: ["company_billing", "company_users", "company_settings", "company_read", "company_write"],
        createdAt: new Date(),
      },
    });
    await prisma.role.create({
      data: {
        id: `rol_${cuid()}`,
        name: RoleType.COMPANY_AUDITOR,
        permissions: ["company_read"],
        createdAt: new Date(),
      },
    });
    await prisma.role.create({
      data: {
        id: `rol_${cuid()}`,
        name: RoleType.COMPANY_MANAGER,
        permissions: ["company_read", "company_write", "company_settings", "company_users"],
        createdAt: new Date(),
      },
    });
    await prisma.role.create({
      data: {
        id: `rol_${cuid()}`,
        name: RoleType.EVENT_AUDITOR,
        permissions: ["event_read"],
        createdAt: new Date(),
      },
    });
    await prisma.role.create({
      data: {
        id: `rol_${cuid()}`,
        name: RoleType.EVENT_MANAGER,
        permissions: ["event_read", "event_write"],
        createdAt: new Date(),
      },
    });
  });
}
"/auth/signup?redirectTo=/inviteId/accept&email=inviteEmail"
async function createInvite(invite: Omit<Invite, "id" | "updatedAt" | "createdAt" | "status" | "emailStatus" | "externalId"> & { role: Omit<RoleType, "ADMINISTRATOR"> }) {
  return await prisma.$transaction(async (prisma) => {
    const invitation = await prisma.invite.create({
      data: {
        ...invite,
        id: `inv_${cuid()}`,
        firstName: invite.firstName?.toLowerCase().trim() || null,
        lastName: invite.lastName?.toLowerCase().trim() || null,
        status: InviteStatus.PENDING,
        emailStatus: "NOT_SENT",
        createdAt: new Date(),
        externalId: null,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        email: invite.email,
      },
    });
    if (user) {
      const account = await prisma.account.findUnique({
        where: {
          id: invite.accountId,
        },
      });
      let eventName: string | undefined = undefined;
      if (invite.eventId) {
        const event = await prisma.event.findUnique({
          where: {
            id: invite.eventId,
          },
        });
        if (!event) throw new Error("Event not found");
        eventName = event.name;
      }
      const admin = await prisma.user.findUnique({
        where: {
          id: account?.userId,
        },
      });
      if (!admin) throw new Error("Admin not found");
      await createNotification({
        title: "Invitation",
        body: `${capitalizeName(eventName || account?.companyName || `${admin.firstName} ${admin.lastName}`)} has invited you to join as ${getRoleName(invite.role)}. Click here to below the invitation.`,
        link: FULL_SERVER_URL + `/auth/invite?id=${invitation.id}`,
      }, undefined, user.id)

    }

    await mailer.sendInvitationEmail(invite.email, {
      invite,
      redirectTo: `/auth/invite?id=${invitation.id}`,
    })
    await prisma.invite.update({
      where: {
        id: invitation.id,
      },
      data: {
        emailStatus: "SENT"
      }
    })
    return invitation;
  });
}

async function switchRole(userId: string, userRoleId: string) {
  const currentSession = await prisma.session.findFirst({
    where: {
      UserRole: {
        userId: userId,
      },
    },
  });
  const userRole = await prisma.userRole.findUnique({
    where: {
      id: userRoleId,
    },
  });
  const newSession = await prisma.session.update({
    where: {
      id: currentSession?.id,
    },
    data: {
      userRoleId: userRole?.id,
    },
  });
  if (!newSession) {
    throw new Error("Failed to update session");
  }
  return newSession;
}

async function updateInviteStatus(inviteId: string, status: InviteStatus) {
  return await prisma.invite.update({
    where: {
      id: inviteId,
    },
    data: {
      status: status,
    },
  })
}
async function createUser(user: Omit<User, "id" | "updatedAt" | "createdAt">, inviteId: string) {
  const userId = `usr_${cuid()}`;
  const create = await prisma.user.create({
    data: {
      ...user,
      createdAt: new Date(),
      id: userId,
    },
  });
  const invitation = await prisma.invite.findUnique({
    where: {
      id: inviteId,
    },
  });
  if (!invitation) {
    throw new Error("Failed to find invite");
  }
  const role = await prisma.role.findUnique({
    where: {
      name: invitation.role,
    },
  });
  if (!role) {
    throw new Error("Failed to find role");
  }
  await updateInviteStatus(inviteId, InviteStatus.ACCEPTED);
  await createUserRole(create.id, role.id, invitation.accountId, invitation.eventId || undefined);
  return create.id;
}
async function createAdminUser(user: Omit<User, "id" | "updatedAt" | "createdAt"> & { companyName?: string }) {
  return await prisma.$transaction(async (prisma) => {
    const userId = `usr_${cuid()}`;
    const accountId = `acc_${cuid()}`;
    const configId = `cfg_${cuid()}`;
    const company = user.companyName;
    user["companyName"] = undefined;
    const createUser = await prisma.user.create({
      data: {
        ...user,
        createdAt: new Date(),
        id: userId,
      },
    });

    await prisma.account.create({
      data: {
        id: accountId,
        companyName: company,
        userId: userId,
        createdAt: new Date(),
      },
    });

    await prisma.configuration.create({
      data: {
        id: configId,
        accountId: accountId,
        createdAt: new Date(),
      },
    });

    let adminRole = await prisma.role.findUnique({
      where: {
        name: RoleType.ADMINISTRATOR,
      },
    });

    if (!adminRole) {
      await createRoles();
      adminRole = await prisma.role.findUnique({
        where: {
          name: RoleType.ADMINISTRATOR,
        },
      });
      if (!adminRole) {
        throw new Error("Failed to create admin role");
      }
    }

    await createUserRole(userId, adminRole.id, accountId);
    return createUser;
  });
}

async function createSession(userRoleId: string) {
  const sessionCode = Math.floor(100000 + Math.random() * 900000);
  // create a session
  // TODO prisma.session.create need verification???
  await prisma.session.create({
    data: {
      id: `ssn_${cuid()}`,
      isVerified: false,
      userRoleId: userRoleId,
      code: sessionCode,
      createdAt: new Date(),
    },
  });
  return sessionCode;
}
async function createEvent(event: Omit<Event, "id" | "updatedAt" | "createdAt" | "isArchived" | "externalId"> & {
  configuration?: Omit<EventConfiguration, "id" | "updatedAt" | "createdAt" | "eventId">, invitees?:
  Array<{
    email: string,
    firstName?: string,
    lastName?: string,
    role: RoleType | "ATTENDEE"
  }>
}) {
  if (!event.startDate || !event.endDate) throw new Error("Event must have a start and end date");
  const configuration = event.configuration;
  const invites = event.invitees;
  event["configuration"] = undefined;
  event["invitees"] = undefined;
  const create = await prisma.event.create({
    data: {
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      id: `evt_${cuid()}`,
      createdAt: new Date(),
    },
  });
  await prisma.eventConfiguration.create({
    data: {
      ...configuration,
      id: `evt_cfg_${cuid()}`,
      eventId: create.id,
      createdAt: new Date(),
    },
  });
  invites?.forEach(async (invitee) => {

    if (invitee.role === "ATTENDEE") {
      const notify = await prisma.attendeeNotify.create({
        data: {
          id: `att_ntf_${cuid()}`,
          email: invitee.email,
          createdAt: new Date(),
          eventId: create.id,
          emailStatus: "NOT_SENT",
        }
      })
      if (configuration?.enableEarlyAccess === true) {
        await mailer.sendNotifyEmails(invitee.email, {
          event: create,
        });
        await prisma.attendeeNotify.update({
          where: {
            id: notify.id,
            email: invitee.email,
          },
          data: {
            hasSent: true,
            emailStatus: "SENT",
          }
        });
      }
    } else {
      await createInvite({
        email: invitee.email,
        firstName: invitee.firstName || null,
        lastName: invitee.lastName || null,
        accountId: event.accountId,
        eventId: create.id,
        role: invitee.role
      });
    }
  });
  return create;
}
async function updateEvent(eventId: string, event: Partial<Omit<Event, "id" | "updatedAt" | "createdAt" | "isArchived" | "externalId">> & {
  configuration?: Partial<Omit<EventConfiguration, "id" | "updatedAt" | "createdAt" | "eventId">>
  invitees?: Array<{
    email: string,
    firstName?: string,
    lastName?: string,
    role: RoleType | "ATTENDEE"
  }>
}) {
  const configuration = event.configuration;
  const invites = event.invitees;
  event["configuration"] = undefined;
  event["invitees"] = undefined;
  const update = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      ...event,
      startDate: event.startDate ? new Date(event.startDate) : undefined,
      endDate: event.endDate ? new Date(event.endDate) : undefined,
    },
  });
  if (configuration) {
    await prisma.eventConfiguration.update({
      where: {
        eventId: eventId,
      },
      data: {
        ...configuration,
      },
    });
  }
  if (invites) {
    invites.forEach(async (invitee) => {
      if (invitee.role === "ATTENDEE") {
        const notify = await prisma.attendeeNotify.create({
          data: {
            id: `att_ntf_${cuid()}`,
            email: invitee.email,
            createdAt: new Date(),
            eventId: update.id,
            emailStatus: "NOT_SENT",
          }
        })
        if (configuration?.enableEarlyAccess === true) {
          await mailer.sendNotifyEmails(invitee.email, {
            event: update,
          });
          await prisma.attendeeNotify.update({
            where: {
              id: notify.id,
              email: invitee.email,
            },
            data: {
              hasSent: true,
              emailStatus: "SENT",
            }
          });
        }
      } else {
        await createInvite({
          email: invitee.email,
          firstName: invitee.firstName || null,
          lastName: invitee.lastName || null,
          accountId: event.accountId!,
          eventId: update.id,
          role: invitee.role
        });
      }
    });
  }
  return update;
}
async function deleteEvent(eventId: string) {
  return await prisma.event.delete({
    where: {
      id: eventId,
    },
  });
}
async function archiveEvent(eventId: string) {
  return await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      isArchived: true,
    },
  });
}

async function deleteInvite(inviteId: string){
  return await prisma.invite.delete({
    where: {
      id: inviteId,
    },
  });
}
async function searchEventsByName(query: string, accountId: string) {
  return await prisma.event.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
      accountId: accountId,
    },
  });
}
async function searchAttendees(query: string, eventId: string) {
  const attendees = await prisma.eventAttendant.findMany({
    where: {
      eventId: eventId,
    },
  });

  const results = attendees.filter((attendee) => {
    return attendee.data;
  })

  return results.map((result: any) => {
    const data: Record<string, unknown> = result.data;
    const keys = Object.keys(data);
    const values = Object.values(data);
    // if any of the values match the query, return the result
    if (values.some((value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(query.toLowerCase());
      }
      return;
    })) {
      return result;
    }
  })
}
async function updateUser(userId: string, user: Partial<Omit<User, "id" | "updatedAt" | "createdAt">>) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...user,
    },
  });
}
async function updateUserRole(userRoleId: string, userRole: Partial<Omit<UserRole, "id" | "updatedAt" | "createdAt">>) {
  return await prisma.userRole.update({
    where: {
      id: userRoleId,
    },
    data: {
      ...userRole,
    },
  });
}
async function updateConfiguration(accountId: string, configuration: Partial<Omit<Configuration, "id" | "updatedAt" | "createdAt">>) {
  return await prisma.configuration.update({
    where: {
      accountId: accountId,
    },
    data: {
      ...configuration,
    },
  });
}

async function updateInvite(inviteId: string, invite: Partial<Omit<Invite, "id" | "updatedAt" | "createdAt">>) {
  return await prisma.invite.update({
    where: {
      id: inviteId,
    },
    data: {
      ...invite,
    },
  });
}
export default {
  search: {
    events: searchEventsByName,
    attendees: searchAttendees,
  },
  create: {
    userRole: createUserRole,
    notification: createNotification,
    roles: createRoles,
    invite: createInvite,
    invitedUser: createUser,
    adminUser: createAdminUser,
    session: createSession,
    event: createEvent,
  },
  get: {
    
    user: (userId: User["id"]) => prisma.user.findUnique({
      where: {
        id: userId,
      },
    }),
    userRole: (userRoleId: string) => prisma.userRole.findUnique({
      where: {
        id: userRoleId,
      },
      include: {
        Role: true,
        Account: true,
        Event: true,
      },
    }),
    // all roles for a user
    userRolesByUser: (userId: User["id"]) => prisma.userRole.findMany({
      where: {
        userId: userId,
      },
      include: {
        Account: true,
        Role: true,
        Event: true,
      },
    }),
    // all roles at company
    userRolesByAccount: (accountId: Account["id"]) => prisma.userRole.findMany({
      where: {
        accountId: accountId,
      },
      include: {
        User: true,
        Account: true,
        Role: true,
        Event: true,
      },
    }),
    // all invites for a company
    invitesByAccount: (accountId: Account["id"]) => prisma.invite.findMany({
      where: {
        accountId: accountId,
      },
    }),
    // all sessions for a user (should only be one)
    sessionsByUser: (userId: User["id"]) => prisma.session.findMany({
      where: {
        UserRole: {
          userId: userId,
        },
      },
    }),
    // configuration for all events at company
    configurationByAccount: (accountId: Account["id"]) => prisma.configuration.findUnique({
      where: {
        accountId: accountId,
      },
    }),
    // all events at company
    eventsByAccount: (accountId: Account["id"], search?: string, pagination?: { skip: number, take: number }) => {
      if (search) {
        if (pagination) {
          return prisma.event.findMany({
            where: {
              accountId: accountId,
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            include: {
              EventConfiguration: {
                select: {
                  attendeeData: true,
                  showAttendeeLeaderboard: true,
                  showSlideControls: true,
                  setLimit: true,
                  enableEarlyAccess: true,
                },
              },
              AttendeeInvites: {
                select: {
                  email: true,
                  hasSent: true,
                  emailStatus: true,
                },
              },
              EventAttendants: {
                select: {
                  data: true,
                }
              },
              Invites: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  status: true,
                  emailStatus: true,
                }
              },
              UserRoles: {
                select: {
                  User: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    }
                  },
                  Role: {
                    select: {
                      name: true,
                      permissions: true,
                    }
                  }
                }
              }
            },
            skip: pagination.skip,
            take: pagination.take,
          });
        }

        return prisma.event.findMany({
          where: {
            accountId: accountId,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          include: {
            EventConfiguration: {
              select: {
                attendeeData: true,
                showAttendeeLeaderboard: true,
                showSlideControls: true,
                setLimit: true,
                enableEarlyAccess: true,
              },
            },
            AttendeeInvites: {
              select: {
                email: true,
                hasSent: true,
                emailStatus: true,
              },
            },
            EventAttendants: {
              select: {
                data: true,
              }
            },
            Invites: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                emailStatus: true,
              }
            },
            UserRoles: {
              select: {
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  }
                },
                Role: {
                  select: {
                    name: true,
                    permissions: true,
                  }
                }
              }
            }
          }
        });
      }

      return prisma.event.findMany({
        where: {
          accountId: accountId,
        },
        include: {
          EventConfiguration: {
            select: {
              attendeeData: true,
              showAttendeeLeaderboard: true,
              showSlideControls: true,
              setLimit: true,
              enableEarlyAccess: true,
            },
          },
          AttendeeInvites: {
            select: {
              email: true,
              hasSent: true,
              emailStatus: true,
            },
          },
          EventAttendants: {
            select: {
              data: true,
            }
          },
          Invites: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              emailStatus: true,
            }
          },
          UserRoles: {
            select: {
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              },
              Role: {
                select: {
                  name: true,
                  permissions: true,
                }
              }
            }
          }
        }
      })
    },
    // all notifications for a user
    notificationsByUser: (userId: User["id"]) => prisma.notification.findMany({
      where: {
        Alerts: {
          some: {
            userId: userId,
          }
        },
      },
    }),
    // all subscriptions at company
    subscriptionsByAccount: (accountId: Account["id"]) => prisma.subscription.findMany({
      where: {
        accountId: accountId,
      },
    }),
    // event attendees
    attendeesByEvent: (eventId: string) => prisma.eventAttendant.findMany({
      where: {
        eventId: eventId,
      },
    }),
    // event staff
    userRolesByEvent: (eventId: string) => prisma.userRole.findMany({
      where: {
        eventId: eventId,
      },
    }),
    getEventById: (eventId: string) => prisma.event.findUnique({
      where: {
        id: eventId
      },
      include: {
        EventConfiguration: {
          select: {
            attendeeData: true,
            showAttendeeLeaderboard: true,
            showSlideControls: true,
            setLimit: true,
            enableEarlyAccess: true,
          },
        },
        AttendeeInvites: {
          select: {
            email: true,
            hasSent: true,
            emailStatus: true,
          },
        },
        EventAttendants: {
          select: {
            data: true,
          }
        },
        Invites: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            emailStatus: true,
          }
        },
        UserRoles: {
          select: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            Role: {
              select: {
                name: true,
                permissions: true,
              }
            }
          }
        }
      }
    }),
  },
  update: {
    inviteStatus: updateInviteStatus,
    role: switchRole,
    event: updateEvent,
    user: updateUser,
    userRole: updateUserRole,
    configuration: updateConfiguration,
    invite: updateInvite
  },
  delete: {
    userRole: removeUserRole,
    invite: deleteInvite,
    event: deleteEvent,
  },
  archive: {
    event: archiveEvent,
  }
};
