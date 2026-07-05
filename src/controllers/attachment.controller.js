const prisma = require("../config/prisma");

// Helper: verify user has access to the task
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

const uploadAttachment = async (req, res) => {
    try {
        const { id: taskId } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const task = await findAccessibleTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const attachment = await prisma.attachment.create({
            data: {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                taskId,
                userId: req.user.userId,
            },
        });
        return res.status(201).json({ success: true, data: attachment });
    } catch (error) {
        console.error("Attachment upload error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAttachments = async (req, res) => {
    try {
        const { id: taskId } = req.params;

        const task = await findAccessibleTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const attachments = await prisma.attachment.findMany({
            where: { taskId },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, data: attachments });
    } catch (error) {
        console.error("Attachment retrieval error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAttachment = async (req, res) => {
    try {
        const { attachmentId } = req.params;

        const attachment = await prisma.attachment.findFirst({
            where: { id: attachmentId, userId: req.user.userId },
        });
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Attachment not found" });
        }

        await prisma.attachment.delete({ where: { id: attachmentId } });
        return res.json({ success: true, message: "Attachment deleted successfully" });
    } catch (error) {
        console.error("Attachment deletion error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { uploadAttachment, getAttachments, deleteAttachment };
