export class BookValidator {
  static validateName(name: string): boolean {
    return name.trim().length >= 3
  }

  static validadeAuthor(author: string): boolean {
    return author.trim().length >= 3
  }

  static validatePublishYear(year: number | null): boolean {
    const currentYear = new Date().getFullYear()

    if (year === null || year === 0) {
      return true
    }

    return Number.isInteger(year) && year > 0 && year <= currentYear
  }

  static validateEdition(edition: number | null): boolean {
    if (edition === null || edition === 0) {
      return true
    }

    return Number.isInteger(edition) && edition > 0
  }
}
