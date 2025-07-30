import {
    Column,
    Entity,
    ManyToOne,
    OneToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
  } from "typeorm";
  
  import Default from "./default";
  import Organisation from "./organisation";
  import User from "./user";
  
  @Entity()
  export default class Media extends Default {
    @Column({
      nullable: true,
    })
    filename!: string;
  
    @Column()
    original_filename!: string;
  
    @Column()
    extension!: string;
  
    @ManyToOne((type) => User)
    @JoinColumn()
    sub!: User;
  
    @ManyToOne((type) => Organisation, (organisation) => organisation.media)
    organisation!: Organisation;
  }
  