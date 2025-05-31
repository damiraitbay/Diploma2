import { Router } from 'express';
import {
    createPoster,
    getAllPosters,
    getPosterById,
    getPostersByClubId,
    getUserPosters,
    updatePoster
} from '../controllers/posterController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize(['head_admin']), createPoster);
router.get('/', getAllPosters);
router.get('/my-posters', authenticate, authorize(['head_admin']), getUserPosters);
router.get('/club/:clubId', getPostersByClubId);
router.get('/:id', getPosterById);
router.put('/:id', authenticate, authorize(['head_admin']), updatePoster);

export default router;