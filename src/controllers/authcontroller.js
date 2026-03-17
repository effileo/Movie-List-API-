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
    // check if the user already exists  
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
    // generate a token for the user and send it in the response
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
const logout = async (req, res) => {
    res.cookie("jwt", "", {
        expires: new Date(0),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success",
        message: "Logged out successfully"
    });
};

/** GET /auth/me – return current user (no password). Requires auth. */
const getMe = async (req, res) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: "Not authorized" });
    }
    res.status(200).json({
        status: "success",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio ?? null,
            avatarUrl: user.avatarUrl ?? null,
            watchlistPublic: user.watchlistPublic ?? true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
};

/** PATCH /auth/me – update profile (name, bio, avatarUrl, watchlistPublic). Requires auth. */
const updateProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authorized" });
    const { name, bio, avatarUrl, watchlistPublic } = req.body;
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name != null && { name }),
            ...(bio !== undefined && { bio: bio || null }),
            ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
            ...(watchlistPublic !== undefined && { watchlistPublic }),
        },
    });
    res.status(200).json({
        status: "success",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio ?? null,
            avatarUrl: user.avatarUrl ?? null,
            watchlistPublic: user.watchlistPublic ?? true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
};

export { register, login, logout, getMe, updateProfile };