import { PoolClient } from 'pg'

import { BaseException } from '../errors/base.exception'
import { Tag } from '../models/Tag'
import { TagRepository } from '../repositories/domain/repository'

export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async findOrCreate(tagname: string, client?: PoolClient): Promise<Tag> {
    try {
      const existing = await this.tagRepository.findByName(tagname, client)
      if (existing) {
        return existing
      }

      return await this.tagRepository.add(tagname, client)
    } catch (err) {
      const fallback = await this.tagRepository.findByName(tagname, client)
      if (fallback) {
        return fallback
      }

      throw BaseException.fromUnknown(err, {
        messagePrefix: 'FIND/CREATE TAG: '
      })
    }
  }

  async findById(id: number, client?: PoolClient): Promise<Tag | null> {
    return this.tagRepository.findById(id, client)
  }

  async list(client?: PoolClient): Promise<Tag[]> {
    return this.tagRepository.list(client)
  }
}
