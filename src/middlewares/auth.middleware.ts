import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import passport from 'passport';
import httpStatus from 'http-status';
import rolesRights from '../config/roles';
import ApiError from '../utils/ApiError';

const auth = (action?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (error: Error, user: User) => {
      if (error) return next(error);
      if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

      if (action) {
        const allowedActions = rolesRights.get(user.role);
        if (!allowedActions || !allowedActions.includes(action)) {
          throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
        }
      }

      req.user = user;
      return next();
    })(req, res, next);
  };
};

export default auth;
