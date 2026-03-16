import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const authMiddleware = async ()=>{
 console.log("authMiddleware called");
};
export default authMiddleware;