const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, userController.updateProfile);

module.exports = router;
