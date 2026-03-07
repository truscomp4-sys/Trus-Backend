"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const seo_controller_1 = require("../controllers/seo.controller");
const router = (0, express_1.Router)();
// Public route for frontend
router.get('/public', seo_controller_1.getSEOPublic);
// Admin routes
router.get('/discovery', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, seo_controller_1.getSEODiscovery);
router.get('/', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, seo_controller_1.getSEOAdmin);
router.post('/', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, seo_controller_1.upsertSEO);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, seo_controller_1.deleteSEO);
exports.default = router;
