import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../utils/validators.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
