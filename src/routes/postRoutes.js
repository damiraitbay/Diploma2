import { Router } from 'express';
import {
    createPost,
    getAllPosts,
    getPostById,
    getUserPosts,
    updatePost,
    deletePost,
    toggleLikePost
} from '../controllers/postController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../utils/fileUploadService.js';

const router = Router();

router.post('/', authenticate, upload.single('image'), createPost);
router.get('/', getAllPosts);
router.get('/my-posts', authenticate, getUserPosts);
router.get('/:id', getPostById);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, toggleLikePost);

export default router;