const prisma = require("../config/prisma");

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        return res.json({ data:user, success: true });
    } catch (error) {
        console.error("Profile retrieval error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { name, email }
        });
        return res.json({ data: updatedUser, success: true });
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

module.exports = { getProfile, updateProfile };