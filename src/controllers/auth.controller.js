const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const { ca } = require("zod/locales");

const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            message: "User registered successfully",
            user: { id: user.id, name: user.name, email: user.email },
            success: true,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: error.message, success: false });
    }
};
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email },
            success: true,
        });
    }catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message, success: false });
    }
};
module.exports = { register, login };