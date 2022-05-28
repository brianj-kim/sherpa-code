import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organizer } from './organizer.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, default: false })
  isOutside: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  date: number;

  @Column({ default: '' })
  attendees: string;

  @ManyToOne(() => Organizer, { eager: true })
  @JoinColumn({ name: 'organizerId', referencedColumnName: 'id' })
  organizer: Organizer;
}
