import { db } from '../db';
import { Knex } from 'knex';

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected db: Knex;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = db;
  }

  protected get table() {
    return this.db<T>(this.tableName);
  }

  async findById(id: string): Promise<T | undefined> {
    return this.table.where('id', id).first();
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const [result] = await this.table.insert(data).returning('*');
    return result;
  }

  async update(
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<T | undefined> {
    const [result] = await this.table
      .where('id', id)
      .update(data)
      .returning('*');
    return result;
  }

  async delete(id: string): Promise<number> {
    return this.table.where('id', id).delete();
  }

  async exists(conditions: Partial<T>): Promise<boolean> {
    const result = await this.table.where(conditions as any).first();
    return !!result;
  }
}
