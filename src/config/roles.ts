import { Role } from '@prisma/client';

export const actions = {
  users: {
    get: 'getUsers',
    create: 'createUsers',
    update: 'updateUsers',
    drop: 'deleteUsers',
  },
};

const roleRights = new Map<Role, string[]>([
  [Role.ADMIN, [actions.users.get, actions.users.create, actions.users.update, actions.users.drop]],
  [Role.USER, []],
]);

export default roleRights;
