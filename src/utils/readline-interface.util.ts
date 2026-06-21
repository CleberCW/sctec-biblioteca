import { createInterface } from 'node:readline/promises'

export class ReadlineInterfaceUtil {
  static readlineInterface = createInterface(process.stdin, process.stdout)
}
