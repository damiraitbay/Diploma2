import { Router } from 'express';
import {
    createClubRequest,
    getAllClubRequests,
    getClubRequestById,
    approveClubRequest,
    rejectClubRequest,
    getUserClubRequests
} from '../controllers/clubRequestController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createClubRequest);
router.get('/', authenticate, authorize(['super_admin']), getAllClubRequests);
router.get('/my-requests', authenticate, getUserClubRequests);
router.get('/:id', authenticate, getClubRequestById);
router.put('/:id/approve', authenticate, authorize(['super_admin']), approveClubRequest);
router.put('/:id/reject', authenticate, authorize(['super_admin']), rejectClubRequest);

export default router;