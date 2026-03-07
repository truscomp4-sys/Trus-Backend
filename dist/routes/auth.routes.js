"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.post('/refresh', auth_controller_1.refresh);
router.post('/logout', auth_controller_1.logout);
// Email Change Routes
router.post('/initiate-email-change', auth_middleware_1.verifyJWT, auth_controller_1.initiateEmailChange);
router.post('/verify-email-change', auth_controller_1.verifyEmailChange);
// Password Reset Routes
router.post('/forgot-password', auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
exports.default = router;
