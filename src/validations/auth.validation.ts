import Joi from 'joi';

const email = Joi.string().required().email().max(128).lowercase().trim();
const password = Joi.string().required().min(6).max(128);
const name = Joi.string().required().min(2).max(128).trim();
const token = Joi.string().required().max(500).trim();

const register = {
  body: Joi.object().keys({
    email,
    name,
  }),
};

const setPassword = {
  body: Joi.object().keys({
    token,
    password,
  }),
};

const login = {
  body: Joi.object().keys({
    email,
    password,
  }),
};

const google = {
  body: Joi.object().keys({
    token,
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: token,
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: token,
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email,
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
};

export default authValidation;
