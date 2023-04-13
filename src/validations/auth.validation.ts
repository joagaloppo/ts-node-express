import Joi from 'joi';

const emailValidation = Joi.string().required().email().max(128).lowercase().trim();
const passwordValidation = Joi.string().required().min(6).max(128);
const nameValidation = Joi.string().required().min(2).max(128).trim();
const tokenValidation = Joi.string().required().max(500).trim();

const register = {
  body: Joi.object().keys({
    email: emailValidation,
    password: passwordValidation,
    name: nameValidation,
  }),
};

const login = {
  body: Joi.object().keys({
    email: emailValidation,
    password: passwordValidation,
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: tokenValidation,
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: tokenValidation,
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: tokenValidation,
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: emailValidation,
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: tokenValidation,
  }),
  body: Joi.object().keys({
    password: passwordValidation,
  }),
};

const authValidation = {
  register,
  login,
  logout,
  refreshTokens,
  verifyEmail,
  forgotPassword,
  resetPassword,
};

export default authValidation;
