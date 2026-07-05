const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const commentController = require("../controllers/comment.controller");
const attachmentController = require("../controllers/attachment.controller");
const authenticate = require("../middleware/auth.middleware");
const upload = require("../config/multer");

// Task CRUD
router.post("/", authenticate, taskController.createTask);
router.get("/", authenticate, taskController.getTasks);
router.get("/:id", authenticate, taskController.getTaskById);
router.put("/:id", authenticate, taskController.updateTask);
router.delete("/:id", authenticate, taskController.deleteTask);

// Task actions
router.post("/:id/complete", authenticate, taskController.completeTask);
router.post("/:id/assign", authenticate, taskController.assignTask);

// Comments
router.post("/:id/comments", authenticate, commentController.addComment);
router.get("/:id/comments", authenticate, commentController.getComments);
router.delete("/:id/comments/:commentId", authenticate, commentController.deleteComment);

// Attachments
router.post("/:id/attachments", authenticate, upload.single("file"), attachmentController.uploadAttachment);
router.get("/:id/attachments", authenticate, attachmentController.getAttachments);
router.delete("/:id/attachments/:attachmentId", authenticate, attachmentController.deleteAttachment);

module.exports = router;