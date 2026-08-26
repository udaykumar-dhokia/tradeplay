import brcypt from "bcrypt";

class Hash {
  encode = async (payload: string) => {
    return await brcypt.hash(payload, 10);
  };

  compare = async (payload: string, hashedPassword: string) => {
    return await brcypt.compare(payload, hashedPassword);
  };
}

export default Hash;
