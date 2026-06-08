const express = require("express");
const router = require("express").Router();
const taskController = require("../controllers/task.controller");
const authenticate = require("../middleware/auth.middleware");

router.post("/", authenticate, taskController.createTask);

module.exports = router;