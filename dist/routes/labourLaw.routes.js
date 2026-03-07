"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const labourLaw_controller_1 = require("../controllers/labourLaw.controller");
const router = (0, express_1.Router)();
// Public route - get all visible updates
router.get('/', labourLaw_controller_1.getAllUpdates);
// Public route - get single update by ID
router.get('/:id', labourLaw_controller_1.getUpdateById);
// Admin routes - require authentication
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, labourLaw_controller_1.upsertUpdate);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, labourLaw_controller_1.deleteUpdate);
exports.default = router;
