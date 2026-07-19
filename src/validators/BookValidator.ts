export class BookValidator {
  static validateTitle(name: string): boolean {
    return name.trim().length >= 3
  }

  static validadeAuthor(author: string): boolean {
    return author.trim().length >= 3
  }

  static validatePublishYear(year: number | undefined): boolean {
    const currentYear = new Date().getFullYear()

    if (year === undefined || year === 0) {
      return true
    }

    return Number.isInteger(year) && year > 0 && year <= currentYear
  }

  static validateEdition(edition: number | undefined): boolean {
    if (edition === undefined || edition === 0) {
      return true
    }

    return Number.isInteger(edition) && edition > 0
  }

  static validateNumPages(numpages: number | undefined): boolean {
    if (numpages === undefined || numpages === 0) {
      return true
    }

    return Number.isInteger(numpages) && numpages > 0
  }

  static validateIsbn(isbn: string): boolean {
    const cleanedIsbn = isbn.replace(/[-\s]/g, '')

    if (cleanedIsbn.length === 10) {
      return this.validateIsbn10(cleanedIsbn)
    } else if (cleanedIsbn.length === 13) {
      return this.validateIsbn13(cleanedIsbn)
    }

    return false
  }

  private static validateIsbn10(isbn: string): boolean {
    let sum = 0

    for (let i = 0; i < 9; i++) {
      const digit = parseInt(isbn.charAt(i), 10)

      if (isNaN(digit)) {
        return false
      }

      sum += (10 - i) * digit
    }

    const checksum = isbn.charAt(9).toUpperCase()

    if (checksum === 'X') {
      sum += 10
    } else {
      const digit = parseInt(checksum, 10)

      if (isNaN(digit)) {
        return false
      }

      sum += digit
    }

    return sum % 11 === 0
  }

  private static validateIsbn13(isbn: string): boolean {
    let sum = 0

    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn.charAt(i), 10)

      if (isNaN(digit)) {
        return false
      }

      sum += i % 2 === 0 ? digit : digit * 3
    }

    const checksum = parseInt(isbn.charAt(12), 10)

    if (isNaN(checksum)) {
      return false
    }

    return (sum + checksum) % 10 === 0
  }
}
