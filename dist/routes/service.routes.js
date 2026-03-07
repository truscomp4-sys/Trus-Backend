"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', service_controller_1.getAllServices);
// Admin routes - MUST be defined before /:slug to prevent wildcard from capturing them
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, service_controller_1.upsertService);
router.get('/categories/all', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, service_controller_1.getServiceCategories);
router.post('/categories/update', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, service_controller_1.updateServiceCategories);
router.post('/category/rename', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, service_controller_1.renameCategory);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, service_controller_1.deleteService);
// Public detail route - MUST be last as it matches any path segment
router.get('/:slug', service_controller_1.getServiceBySlug);
exports.default = router;
