"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enquiry_controller_1 = require("../controllers/enquiry.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public route
router.post('/submit', enquiry_controller_1.submitEnquiry);
// Admin routes
router.get('/', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, enquiry_controller_1.getAllEnquiries);
router.post('/', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, enquiry_controller_1.createEnquiry);
router.put('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, enquiry_controller_1.updateEnquiry);
router.patch('/:id/status', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, enquiry_controller_1.updateEnquiryStatus);
router.delete('/:id', auth_middleware_1.verifyJWT, auth_middleware_1.isAdmin, enquiry_controller_1.deleteEnquiry);
exports.default = router;
