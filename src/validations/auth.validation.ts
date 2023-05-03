import Joi from 'joi';

const emailValidation = Joi.string().required().email().max(128).lowercase().trim();
const passwordValidation = Joi.string().required().min(6).max(128);
const nameValidation = Joi.string().required().min(2).max(128).trim();
const tokenValidation = Joi.string().required().max(500).trim();

const register = {
  body: Joi.object().keys({
    email: emailValidation,
    name: nameValidation,
  }),
};

const setPassword = {
  body: Joi.object().keys({
    token: tokenValidation,
    password: passwordValidation,
  }),
};

const login = {
  body: Joi.object().keys({
    email: emailValidation,
    password: passwordValidation,
  }),
};

const google = {
  body: Joi.object().keys({
    token: tokenValidation,
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
  setPassword,
  login,
  google,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
};

export default authValidation;
