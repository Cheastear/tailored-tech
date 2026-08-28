export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}
