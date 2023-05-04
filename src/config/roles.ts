import { Role } from '@prisma/client';

export const actions = {
  users: {
    get: 'getUsers',
    create: 'createUsers',
    edit: 'editUsers',
    delete: 'deleteUsers',
  },
};

const roleRights = new Map<Role, string[]>([
  [Role.ADMIN, [actions.users.get, actions.users.create, actions.users.edit, actions.users.delete]],
  [Role.USER, []],
]);

export default roleRights;
