"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// Integrated Dashboard Stats
router.get('/dashboard/stats', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, dashboard_controller_1.getDashboardStats);
exports.default = router;
