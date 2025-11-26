// src/entities/BaseEntity.ts
import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @Property({ type: 'Date', onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ type: 'Date', onUpdate: () => new Date(), onCreate: () => new Date() })
    updatedAt: Date = new Date();
}