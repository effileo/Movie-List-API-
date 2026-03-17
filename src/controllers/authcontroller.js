import prisma from "../config/db.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../libs/generateToken.js"

/** Try native bcrypt (e.g. if existing hashes were created with 'bcrypt' package). */
async function compareWithNativeBcrypt(password, hash) {
    try {
        const native = await import("bcrypt");
        return native.default.compare(password, hash);
    } catch {
        return false;
    }
}
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

/** True if the stored value looks like a bcrypt hash (so we don't treat it as plain text). */
function isBcryptHash(stored) {
    if (!stored || typeof stored !== "string") return false;
    return /^\$2[aby]\$\d{2}\$/.test(stored);
}

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "invalid credentials!" });
    }
    const emailTrimmed = typeof email === 'string' ? email.trim() : String(email);

    // Find user: exact match first, then case-insensitive (DB may have different casing)
    let user = await prisma.user.findUnique({
        where: { email: emailTrimmed },
    });
    if (!user) {
        const normalizedEmail = emailTrimmed.toLowerCase();
        if (normalizedEmail !== emailTrimmed) {
            user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        }
        if (!user) {
            try {
                user = await prisma.user.findFirst({
                    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
                });
            } catch {
                // Fallback: raw SQL so we always find by email regardless of casing
                const rows = await prisma.$queryRawUnsafe(
                    'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1',
                    emailTrimmed
                );
                if (rows && rows[0]) {
                    user = await prisma.user.findUnique({ where: { id: rows[0].id } });
                }
            }
        }
    }
    if (!user) {
        return res.status(400).json({ message: "invalid credentials!" });
    }

    let isValid = false;
    if (isBcryptHash(user.password)) {
        try {
            // Current app uses bcryptjs; existing users may have been hashed with native 'bcrypt'
            isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                isValid = await compareWithNativeBcrypt(password, user.password);
            }
            if (!isValid && password.trim() !== password) {
                isValid = await bcrypt.compare(password.trim(), user.password)
                    || await compareWithNativeBcrypt(password.trim(), user.password);
            }
        } catch {
            isValid = user.password === password;
        }
    } else {
        isValid = user.password === password;
    }

    if (!isValid) {
        return res.status(400).json({ message: "invalid credentials!" });
    }

    // Upgrade legacy plain-text password to bcrypt on successful login
    if (!isBcryptHash(user.password)) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
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