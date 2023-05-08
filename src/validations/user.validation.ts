import Joi from 'joi';

const userId = Joi.number().required();
const email = Joi.string().email().max(128).lowercase().trim();
const name = Joi.string().min(2).max(128).trim();
const password = Joi.string().min(6).max(128);

const get = {
  params: Joi.object().keys({ userId }),
};

const create = {
  body: Joi.object().keys({ email: email.required(), name: name.required(), password: password.required() }),
};

const updateMe = {
  body: Joi.object().keys({ name, password }),
};

const update = {
  params: Joi.object().keys({ userId }),
  body: Joi.object().keys({ name, password }),
};

const drop = {
  params: Joi.object().keys({ userId }),
};

export default { get, create, update, updateMe, drop };
