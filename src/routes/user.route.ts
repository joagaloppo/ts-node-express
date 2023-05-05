import express from 'express';
import auth from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { userValidation } from '../validations';
import { userController } from '../controllers';
import { actions } from '../config/roles';

const router = express.Router();

router.get('/secret', auth(), (req, res) => res.json(req.user));

router
  .route('/')
  .get(auth(actions.users.get), userController.getUsers)
  .post(auth(actions.users.create), validate(userValidation.create), userController.createUser)
  .delete(auth(actions.users.drop), userController.dropAllUsers);

router
  .route('/:userId')
  .get(auth(actions.users.get), validate(userValidation.get), userController.getUser)
  .patch(auth(actions.users.edit), validate(userValidation.edit), userController.updateUser)
  .delete(auth(actions.users.drop), validate(userValidation.drop), userController.dropUser);

export default router;
