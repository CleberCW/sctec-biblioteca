import { PoolClient } from 'pg'

import { Tag } from '../models/Tag'
import { TagRepository } from '../repositories/domain/repository'

export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async findOrCreate(tagname: string, client?: PoolClient): Promise<Tag> {
    const existing = await this.tagRepository.findByName(tagname, client)

    if (existing) {
      return existing
    }

    return this.tagRepository.add(tagname, client)
  }

  async findById(id: number, client?: PoolClient): Promise<Tag | null> {
    return this.tagRepository.findById(id, client)
  }

  async list(client?: PoolClient): Promise<Tag[]> {
    return this.tagRepository.list(client)
  }
}
