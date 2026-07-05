const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./config/prisma');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const teamRoutes = require('./routes/team.routes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/teams', teamRoutes);
app.get("/", (req, res) => {
    res.json({ message: "Welcome to TaskMaster API!" });});

app.get("/health", async(req, res) => {
    const users = await prisma.user.findMany();
    res.json({ status: "ok", usersCount: users.length, users: users });
});


module.exports = app;