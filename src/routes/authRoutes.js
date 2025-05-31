import express from 'express';
import { register, login, changePassword, verifyEmail } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.put('/change-password', authMiddleware, changePassword);

export default router;