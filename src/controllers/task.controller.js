const prisma = require("../config/prisma");

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED"];

const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, teamId } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }
        const task = await prisma.task.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                creatorId: req.user.userId,
                teamId: teamId || null,
            },
        });
        return res.status(201).json({ data: task, success: true });
    } catch (error) {
        console.error("Task creation error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const getTasks = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10, assignedToMe } = req.query;

        const where = assignedToMe === "true"
            ? { assigneeId: req.user.userId }
            : { creatorId: req.user.userId };

        if (status) {
            const upperStatus = status.toUpperCase();
            if (VALID_STATUSES.includes(upperStatus)) {
                where.status = upperStatus;
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    creator: { select: { id: true, name: true, email: true } },
                    assignee: { select: { id: true, name: true, email: true } },
                    team: { select: { id: true, name: true } },
                },
            }),
            prisma.task.count({ where }),
        ]);

        return res.json({ success: true, page: Number(page), total, data: tasks });
    } catch (error) {
        console.error("Task retrieval error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findFirst({
            where: {
                id,
                OR: [
                    { creatorId: req.user.userId },
                    { assigneeId: req.user.userId },
                    { team: { members: { some: { userId: req.user.userId } } } },
                ],
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
                comments: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: "desc" },
                },
                attachments: true,
            },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found", success: false });
        }
        return res.json({ data: task, success: true });
    } catch (error) {
        console.error("Task retrieval error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, status } = req.body;
        const task = await prisma.task.findFirst({
            where: { id, creatorId: req.user.userId },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found", success: false });
        }
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
        }
        const data = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        if (status !== undefined) data.status = status;

        const updatedTask = await prisma.task.update({ where: { id }, data });
        return res.json({ data: updatedTask, success: true });
    } catch (error) {
        console.error("Task update error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findFirst({
            where: { id, creatorId: req.user.userId },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found", success: false });
        }
        await prisma.task.delete({ where: { id } });
        return res.json({ message: "Task deleted successfully", success: true });
    } catch (error) {
        console.error("Task deletion error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const completeTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findFirst({
            where: {
                id,
                OR: [
                    { creatorId: req.user.userId },
                    { assigneeId: req.user.userId },
                ],
            },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found", success: false });
        }
        const updatedTask = await prisma.task.update({
            where: { id },
            data: { status: "COMPLETED" },
        });
        return res.json({ data: updatedTask, success: true });
    } catch (error) {
        console.error("Task completion error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

const assignTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigneeId, teamId } = req.body;

        const task = await prisma.task.findFirst({
            where: { id, creatorId: req.user.userId },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found", success: false });
        }

        // If assigning to a team member, verify membership
        if (teamId && assigneeId) {
            const membership = await prisma.teamMember.findUnique({
                where: { userId_teamId: { userId: assigneeId, teamId } },
            });
            if (!membership) {
                return res.status(400).json({ success: false, message: "User is not a member of the specified team" });
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                assigneeId: assigneeId || null,
                teamId: teamId !== undefined ? teamId : task.teamId,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
            },
        });
        return res.json({ data: updatedTask, success: true });
    } catch (error) {
        console.error("Task assignment error:", error);
        return res.status(500).json({ message: error.message, success: false });
    }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, completeTask, assignTask };