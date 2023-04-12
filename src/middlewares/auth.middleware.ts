import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import passport from 'passport';

const isAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (error: Error, user: User) => {
    if (error) return next(error);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    return next();
  })(req, res, next);
};

export default isAuth;
