"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', settings_controller_1.getAllPublicSettings);
router.get('/:key', settings_controller_1.getSetting);
// Admin routes
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, settings_controller_1.upsertSetting);
router.post('/batch', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, settings_controller_1.batchUpdateSettings);
router.post('/test-email', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, settings_controller_1.sendTestEmail);
exports.default = router;
