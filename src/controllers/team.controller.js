const prisma = require("../config/prisma");

const createTeam = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Team name is required" });
        }

        const team = await prisma.team.create({
            data: {
                name,
                description,
                members: {
                    create: { userId: req.user.userId },
                },
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
        });

        return res.status(201).json({ success: true, data: team });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const joinTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        if (!teamId) {
            return res.status(400).json({ success: false, message: "teamId is required" });
        }

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }

        const existingMembership = await prisma.teamMember.findUnique({
            where: { userId_teamId: { userId: req.user.userId, teamId } },
        });
        if (existingMembership) {
            return res.status(400).json({ success: false, message: "Already a member of this team" });
        }

        const membership = await prisma.teamMember.create({
            data: { teamId, userId: req.user.userId },
        });
        return res.json({ data: membership, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getTeams = async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            where: { members: { some: { userId: req.user.userId } } },
            include: {
                _count: { select: { members: true, tasks: true } },
            },
        });
        return res.json({ success: true, data: teams });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await prisma.team.findFirst({
            where: {
                id: teamId,
                members: { some: { userId: req.user.userId } },
            },
            include: {
                members: { include: { user: { select: { id: true, name: true, email: true } } } },
            },
        });
        if (!team) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }
        return res.json({ success: true, data: team });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getTeamMembers = async (req, res) => {
    try {
        const { teamId } = req.params;
        const members = await prisma.teamMember.findMany({
            where: { teamId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
        return res.json({ data: members, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getTeamTasks = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const membership = await prisma.teamMember.findUnique({
            where: { userId_teamId: { userId: req.user.userId, teamId } },
        });
        if (!membership) {
            return res.status(403).json({ success: false, message: "Access denied: not a team member" });
        }

        const where = { teamId };
        if (status) {
            const upperStatus = status.toUpperCase();
            if (["OPEN", "IN_PROGRESS", "COMPLETED"].includes(upperStatus)) {
                where.status = upperStatus;
            }
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
                },
            }),
            prisma.task.count({ where }),
        ]);

        return res.json({ success: true, page: Number(page), total, data: tasks });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createTeam, joinTeam, getTeams, getTeam, getTeamMembers, getTeamTasks };