export type TUser = {
  id: string;
  first_name: string;
  last_name: string | null;
  mobile: string | null;
  email: string;
  password: string;
  is_email_verified: boolean;
};
