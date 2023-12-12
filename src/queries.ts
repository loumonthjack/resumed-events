import { QueryClient, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { ZodSchema, z } from "zod";

import type { User } from "@prisma/client";

import { FULL_SERVER_URL } from "./env/client";

export const queryClient = new QueryClient();

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  terms: z.boolean(),
  profilePicture: z.string().or(z.null()),
  createdAt: z.date(),
  updatedAt: z.date().or(z.null()),
  isFirstTime: z.boolean(),
  isVerified: z.boolean(),
});

async function fetchApi<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const url = new URL(endpoint, FULL_SERVER_URL);
  const response = await fetch(new URL(endpoint, FULL_SERVER_URL), init);
  const json = await response.json();
  // TODO validation
  return json as T;
}

const queryUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: () => fetchApi<User>("operation/getUser"),
  });
};

export default {
  client: queryClient,
  getUser: queryUser,
};
