import type { Request, Response } from "express";
import type { TCreateUser } from "./dto/createUser.dto";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import AuthService from "./auth.service";
import Hash from "../utils/hash.util";
import Jwt from "../utils/jwt.util";
import cookieOptions from "../utils/cookie.util";

/**
 * AuthController
 * Handles authentication-related HTTP requests and responses.
 * Manages user registration, validation, password hashing, and JWT token generation.
 */
class AuthController {
  private authService: AuthService;
  private hash: Hash;
  private jwt: Jwt;

  constructor() {
    this.authService = new AuthService();
    this.hash = new Hash();
    this.jwt = new Jwt();
  }

  /**
   * Registers a new user with validation, password hashing, and token generation.
   *
   * @param {Request<{}, {}, TCreateUser>} req - Express request containing user data (email, first_name, password, last_name, mobile)
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with status and message
   *
   * @description
   * - Validates required fields (email, first_name, password)
   * - Checks if user already exists
   * - Hashes password using bcrypt
   * - Creates user in database
   * - Generates JWT token
   * - Sets token in HTTP-only cookie
   *
   * @throws Returns 400 if required fields are missing
   * @throws Returns 409 if user already exists
   * @throws Returns 500 if server error occurs during processing
   */
  registerUser = async (req: Request<{}, {}, TCreateUser>, res: Response) => {
    const { email, first_name, password, last_name, mobile } = req.body;

    if (!email || !first_name || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: ReasonPhrases.BAD_GATEWAY });
    }

    try {
      const userExists = await this.authService.findUserByEmail(email);
      if (userExists) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: ReasonPhrases.CONFLICT });
      }

      const hashedPassword = await this.hash.encode(password);
      if (!hashedPassword) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
      }

      const userPayload: TCreateUser = {
        email: email,
        first_name: first_name,
        password: hashedPassword,
        last_name: last_name,
        mobile: mobile,
      };
      const newUser = await this.authService.createUser(userPayload);
      if (!newUser) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
      }

      const token = await this.jwt.sign(newUser.id);
      if (!token) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
      }

      res.cookie("token", token, cookieOptions);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: ReasonPhrases.CREATED });
    } catch {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Authenticates an existing user with email and password verification.
   *
   * @param {Request} req - Express request containing user credentials (email, password)
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with status and message
   *
   * @description
   * - Validates required fields (email, password)
   * - Checks if user exists in database
   * - Compares provided password with stored hashed password
   * - Generates JWT token on successful authentication
   * - Sets token in HTTP-only cookie
   *
   * @throws Returns 400 if required fields are missing
   * @throws Returns 400 if user not found or password is incorrect
   * @throws Returns 500 if server error occurs during processing
   */
  loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: ReasonPhrases.BAD_GATEWAY });
    }

    try {
      const userExists = await this.authService.findUserByEmail(email);
      if (!userExists) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: ReasonPhrases.BAD_REQUEST });
      }

      if (!(await this.hash.compare(password, userExists.password))) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: ReasonPhrases.BAD_REQUEST });
      }

      const token = await this.jwt.sign(userExists.id);
      if (!token) {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
      }

      res.cookie("token", token, cookieOptions);

      return res.status(StatusCodes.OK).json({ message: ReasonPhrases.OK });
    } catch (e) {
      console.log(e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new AuthController();
