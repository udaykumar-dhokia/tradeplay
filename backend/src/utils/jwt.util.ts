import jwt, { type JwtPayload } from "jsonwebtoken";

export interface IJwtPayload extends JwtPayload {
  userId: string;
}

class Jwt {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "JWT_SECRET";
  }

  sign = async (payload: string): Promise<string> => {
    return await jwt.sign(
      {
        userId: payload,
      },
      this.jwtSecret,
    );
  };

  verify = async (token: string): Promise<IJwtPayload> => {
    const decoded = jwt.verify(token, this.jwtSecret);

    if (typeof decoded === "string" || !decoded.userId) {
      throw new Error("Invalid token payload");
    }

    return decoded as IJwtPayload;
  };
}

export default Jwt;
