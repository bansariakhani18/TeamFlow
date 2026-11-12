import express from 'express';
import { protect } from '../middleware/protect.js';
import { validate } from '../middleware/validate.js';
import { updateCommentSchema } from '../utils/validators.js';
import { updateComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.use(protect);

router
  .route('/:commentId')
  .put(validate(updateCommentSchema), updateComment)
  .delete(deleteComment);

export default router;
