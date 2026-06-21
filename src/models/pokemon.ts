export class Pokemon {
  id: number

  name: string

  types: string[]

  height: number

  weight: number

  constructor(props: Pokemon) {
    this.id = props.id
    this.name = props.name
    this.types = props.types
    this.height = props.height
    this.weight = props.weight
  }
}
