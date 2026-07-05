const express = require("express");
const router = express.Router();
const teamController = require("../controllers/team.controller");
const authenticate = require("../middleware/auth.middleware");

router.post("/", authenticate, teamController.createTeam);
router.get("/", authenticate, teamController.getTeams);
router.post("/join", authenticate, teamController.joinTeam);
router.get("/:teamId", authenticate, teamController.getTeam);
router.get("/:teamId/members", authenticate, teamController.getTeamMembers);
router.get("/:teamId/tasks", authenticate, teamController.getTeamTasks);

module.exports = router;