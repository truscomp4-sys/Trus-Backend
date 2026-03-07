"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blog_controller_1 = require("../controllers/blog.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', blog_controller_1.getAllBlogs);
router.get('/:id', blog_controller_1.getBlogById);
// Admin routes
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, blog_controller_1.upsertBlog);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, blog_controller_1.deleteBlog);
exports.default = router;
