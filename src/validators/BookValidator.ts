export class BookValidator {
  static validateName(name: string): boolean {
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
}
