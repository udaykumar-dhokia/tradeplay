import jwt from "jsonwebtoken";

class Jwt {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "JWT_SECRET";
  }

  sign = async (payload: Object) => {
    return await jwt.sign(payload, this.jwtSecret);
  };
}

export default Jwt;
