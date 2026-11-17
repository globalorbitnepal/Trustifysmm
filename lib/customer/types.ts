export type CustomerRole = "CUSTOMER";

export type CustomerUser = {
  id: string;
  email: string;
  emailVerified: string | null;
  name: string | null;
  image: string | null;
  passwordHash: string | null;
  googleId: string | null;
  role: CustomerRole;
  apiKey: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicCustomer = Pick<CustomerUser, "id" | "email" | "name" | "image" | "role" | "apiKey" | "balance">;