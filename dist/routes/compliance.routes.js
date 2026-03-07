"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compliance_controller_1 = require("../controllers/compliance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', compliance_controller_1.getAllComplianceUpdates);
router.get('/:slug', compliance_controller_1.getComplianceUpdateBySlug);
// Admin routes
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, compliance_controller_1.upsertComplianceUpdate);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, compliance_controller_1.deleteComplianceUpdate);
exports.default = router;
