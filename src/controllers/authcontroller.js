import prisma from "../config/db.js"
import bcrypt from "bcryptjs"
import {generateToken} from "../libs/generateToken.js"
const register = async (req, res) => {
    const { name, email, password } = req.body;
    const userExist = await prisma.user.findUnique({
        where: {
            email: email,
        }
    });
    if (userExist) {
        return res.status(400).json({
            message: "user already exists"
        });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)
    const user = await prisma.user.create(
        {
            data: {
                name,
                email,
                password: hashedPassword
            },
        }
    );
    const token = generateToken(user.id, res);
    res.status(201).json({
        status: "success",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        token,
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        return res.status(400).json({
            message: "invalid credentials!"
        });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(400).json({
            message: "invalid credentials!"
        });
    }
    const token = generateToken(user.id, res);

    res.status(200).json({
        status: "success",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        token,
    });

};

export { register, login };