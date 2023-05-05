import Joi from 'joi';

const email = Joi.string().email().max(128).lowercase().trim();
const name = Joi.string().min(2).max(128).trim();
const password = Joi.string().min(6).max(128);

const get = {
  params: Joi.object().keys({
    userId: Joi.number().required(),
  }),
};

const create = {
  body: Joi.object().keys({
    email: email.required(),
    name: name.required(),
    password: password.required(),
  }),
};

const edit = {
  body: Joi.object().keys({
    email,
    name,
    password,
  }),
};

const drop = {
  params: Joi.object().keys({
    userId: Joi.number().required(),
  }),
};

const userValidation = {
  get,
  create,
  edit,
  drop,
};

export default userValidation;
