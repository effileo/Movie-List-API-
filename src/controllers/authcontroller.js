import prisma from "../config/db.js"
import bcrypt from "bcryptjs"
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
    res.status(201).json({
        status: "success",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    });
};

export { register };