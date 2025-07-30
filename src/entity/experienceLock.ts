import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
  } from "typeorm";
  
  import Default from "./default";
  import Experience from "./experience";
  import User from "./user";
  
  @Entity()
  export default class ExperienceLock {
    @PrimaryGeneratedColumn("uuid")
    id!: number;
  
    @OneToOne((type) => Experience, (experience) => experience.lock)
    @JoinColumn()
    experience!: Experience;
  
    @ManyToOne((type) => User)
    locked_by!: User;
  
    @Column()
    last_activity!: Date;
  }
  