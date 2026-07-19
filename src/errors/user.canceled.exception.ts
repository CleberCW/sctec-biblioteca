import { BaseException } from './base.exception'

export class UserCancelledException extends BaseException {
  constructor() {
    super({
      code: 'USER_CANCELLED',
      cause: 'Operação cancelada pelo usuário.'
    })
  }
}
