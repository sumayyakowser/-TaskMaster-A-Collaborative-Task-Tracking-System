const prisma = require("../config/prisma");

const createTask = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }
        const task = await prisma.task.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
               
                createdBy: { connect: { id: req.user.userId } }
            },
        });
        return res.status(201).json({ data: task, success: true });
    } catch (error) {
        console.error("Task creation error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

module.exports = { createTask };