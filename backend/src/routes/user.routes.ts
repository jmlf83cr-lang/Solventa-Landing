import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), UserController.getUsers);
router.get('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), UserController.getUserById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.createUser);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.updateUser);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.deleteUser);

export default router;
