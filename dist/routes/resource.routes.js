"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resource_controller_1 = require("../controllers/resource.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)();
// Public routes
router.get('/', resource_controller_1.getResources);
// Admin routes
// Use upload.any() to handle multipart/form-data if sent (text fields or files)
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, upload.any(), resource_controller_1.upsertResource);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, resource_controller_1.deleteResource);
exports.default = router;
