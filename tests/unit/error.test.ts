import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import { errorConverter } from '../../src/middlewares/error.middleware';
import ApiError from '../../src/utils/ApiError';

type CustomError = {
  statusCode?: number;
  status?: number;
  message?: string;
  stack?: string;
  isOperational?: boolean;
} & Error;

describe('Error middlewares', () => {
  describe('Error converter', () => {
    it('should return the same ApiError object it was called with', () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
      const next = jest.fn();
      errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should convert an Error to ApiError and preserve its status and message', () => {
      const error: CustomError = new Error('Any error');
      error.statusCode = httpStatus.BAD_REQUEST;
      const next = jest.fn();
      errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: error.statusCode,
          message: error.message,
          isOperational: false,
        })
      );
    });

    it('should convert an Error without status to ApiError with status 500', () => {
      const error: CustomError = new Error('Any error');
      const next = jest.fn();
      errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          isOperational: false,
        })
      );
    });

    it('should convert an Error without message to ApiError with default message of that http status', () => {
      const error: CustomError = new Error();
      error.statusCode = httpStatus.BAD_REQUEST;
      const next = jest.fn();
      errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);
      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: error.statusCode,
          message: expect.any(String),
          isOperational: false,
        })
      );
    });
  });
});
