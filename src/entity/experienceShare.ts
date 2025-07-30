import { Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from "typeorm";
import Experience from "./experience";
import User from "./user";

@Entity()
export default class ExperienceShare {
  @PrimaryColumn()
  experience_id!: number;

  @PrimaryColumn()
  shared_to_id!: number;

  @PrimaryColumn()
  shared_by_id!: number;

  @ManyToOne(() => Experience)
  @JoinColumn({ name: "experience_id" })
  experience!: Experience;

  @ManyToOne(() => User)
  @JoinColumn({ name: "shared_to_id" })
  shared_to!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "shared_by_id" })
  shared_by!: User;

  @CreateDateColumn()
  shared_at!: Date;
}