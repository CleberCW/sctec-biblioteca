export class UserValidator {
  static validateName(name: string): boolean {
    return name.trim().length >= 3
  }

  static validateCpf(cpf: string): boolean {
    const cleanedCpf = cpf.replace(/[-\s]/g, '')

    if (cleanedCpf.length !== 11) {
      return false
    }

    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanedCpf.substring(i - 1, i), 10) * (11 - i)
    }

    remainder = (sum * 10) % 11

    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }

    if (remainder !== parseInt(cleanedCpf.substring(9, 10), 10)) {
      return false
    }

    sum = 0

    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanedCpf.substring(i - 1, i), 10) * (12 - i)
    }

    remainder = (sum * 10) % 11

    if (remainder === 10 || remainder === 11) {
      remainder = 0
    }

    if (remainder !== parseInt(cleanedCpf.substring(10, 11), 10)) {
      return false
    }

    return true
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhone(phone: string): boolean {
    const cleanedPhone = phone.replace(/[-\s]/g, '')

    if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
      return false
    }

    const phoneRegex = /^\d{10,11}$/
    return phoneRegex.test(cleanedPhone)
  }
}
