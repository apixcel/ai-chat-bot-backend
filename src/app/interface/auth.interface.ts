export type TRoles = "user" | "admin";

export interface IUserJWTPayload {
  id: string;
  email: string;
  role: TRoles;
}

export interface IUser {
  role: TRoles;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}
