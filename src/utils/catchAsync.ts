import { Request, Response, NextFunction } from 'express';

const catchAsync = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  })();
};

export default catchAsync;
