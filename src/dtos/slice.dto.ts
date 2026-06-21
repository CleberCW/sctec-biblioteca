export class SliceDto<T> {
  next: {
    offset: number
  } | null

  previous: {
    offset: number
  } | null

  results: T[]

  constructor(data: SliceDto<T>) {
    this.next = data.next
    this.previous = data.previous
    this.results = data.results
  }
}
