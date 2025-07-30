import {
    ManyToOne,
    OneToOne,
    Column,
    Entity,
    JoinColumn,
    OneToMany,
  } from "typeorm";
  
  import Default from "./default";
  import Media from "./media";
  import Surface from "./surface";
  import User from "./user";
  
  @Entity()
  export default class Layout extends Default {
    @Column()
    name!: string;
  
    @ManyToOne((type) => User)
    @JoinColumn()
    sub!: User;
  
    @OneToMany((type) => Surface, (surface) => surface.layout)
    surfaces!: Surface[];
  
    @OneToOne((type) => Media, { nullable: true })
    @JoinColumn()
    media!: Media;
  }
  