const prisma = require("../config/prisma");

// Helper: verify user has access to the task (creator, assignee, or team member)
const findAccessibleTask = (taskId, userId) =>
    prisma.task.findFirst({
        where: {
            id: taskId,
            OR: [
                { creatorId: userId },
                { assigneeId: userId },
                { team: { members: { some: { userId } } } },
            ],
        },
    });

const addComment = async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const task = await findAccessibleTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const comment = await prisma.comment.create({
            data: { message: message.trim(), taskId, userId: req.user.userId },
            include: { user: { select: { id: true, name: true } } },
        });
        return res.status(201).json({ success: true, data: comment });
    } catch (error) {
        console.error("Comment creation error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const { id: taskId } = req.params;

        const task = await findAccessibleTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, data: comments });
    } catch (error) {
        console.error("Comment retrieval error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await prisma.comment.findFirst({
            where: { id: commentId, userId: req.user.userId },
        });
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        return res.json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Comment deletion error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addComment, getComments, deleteComment };
