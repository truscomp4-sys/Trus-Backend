"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testimonials_controller_1 = require("../controllers/testimonials.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', testimonials_controller_1.getAllTestimonials);
router.get('/why-choose-us', testimonials_controller_1.getAllWhyChooseUs);
// Admin routes
router.post('/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, testimonials_controller_1.upsertTestimonial);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, testimonials_controller_1.deleteTestimonial);
router.post('/why-choose-us/upsert', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, testimonials_controller_1.upsertWhyChooseUs);
router.delete('/why-choose-us/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, testimonials_controller_1.deleteWhyChooseUs);
exports.default = router;
