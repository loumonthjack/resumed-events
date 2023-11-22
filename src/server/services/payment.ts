import { Request, Response as ExpressResponse, Router } from "express";
import { prisma } from "./database";
import Messenger from "./mailer";
import {
  RoleType,
  SubscriptionPeriodEnum,
  SubscriptionStatusEnum,
  SubscriptionTypeEnum,
} from "@prisma/client";
// import { stripe } from "../constants";
import { createId as cuid } from "@paralleldrive/cuid2";

import { stripe } from "../main";

export async function handleCharge(event: Request["body"]) {
  if (event.data.object.payment_status !== "paid") return false;
  if (!event.data.object.customer_details.email) return false;
  const planType = await prisma.subscriptionType.findUnique({
    where: {
      externalId: event.data.object.payment_link,
    },
  });
  if (!planType) throw new Error("Plan not found");
  // get user most recent event by email address and get isPaid attribute is false
  const user = await prisma.user.findUnique({
    where: {
      email: event.data.object.customer_details.email,
    },
  });
  if (!user) throw new Error("Event not found");
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      Role: {
        name: RoleType.ADMINISTRATOR
      }
    },
  });
  if (!userRole) throw new Error("User role not found");
  await prisma.subscription.create({
    data: {
      id: `sub_${cuid()}`,
      status: SubscriptionStatusEnum.ACTIVE,
      externalId: event.data.object.subscription,
      Account: {
        connect: {
          id: userRole.accountId,
        },
      },
      SubscriptionType: {
        connect: {
          id: planType.id,
        },
      },
      createdAt: new Date(),
    },
  });

  await prisma.account.update({
    where: {
      id: userRole.accountId,
    },
    data: {
      isActive: true,
    },
  });

  return true;
}

export const checkSubscription = async (stripeId: string) => {
  const subscription = await stripe.subscriptions.retrieve(stripeId);
  if (subscription.status === "active") return true;
  const sub = await prisma.subscription.update({
    where: {
      externalId: stripeId,
      status: SubscriptionStatusEnum.ACTIVE,
    },
    data: {
      status: SubscriptionStatusEnum.INACTIVE,
    },
  });
  if (!sub) throw new Error("Subscription not found");
  await prisma.account.update({
    where: {
      id: sub.accountId,
    },
    data: {
      isActive: false,
    },
  });

  return false;
};
