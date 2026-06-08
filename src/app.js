const express = require('express');
const cors = require('cors');
const prisma = require('./config/prisma');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.get("/", (req, res) => {
    res.json({ message: "Welcome to TaskMaster API!" });});

app.get("/health", async(req, res) => {
    const users = await prisma.user.findMany();
    res.json({ status: "ok", usersCount: users.length, users: users });
});


module.exports = app;