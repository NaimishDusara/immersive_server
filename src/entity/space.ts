import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToOne,
    ManyToMany,
    OneToMany,
    OneToOne,
  } from "typeorm";
  
  import Default from "./default";
//   import Device from "./device";
  import Layout from "./layout";
  import Media from "./media";
  import Organisation from "./organisation";
  import User from "./user";
  
  @Entity()
  export default class Space extends Default {
    @Column()
    name!: string;
  
    // @ManyToMany((type) => Device)
    // @JoinTable()
    // devices: Device[];
  
    @ManyToOne((type) => Layout)
    @JoinColumn()
    layout!: Layout;
  
    @ManyToOne((type) => User)
    @JoinColumn()
    sub!: User;
  
    @ManyToOne((type) => Organisation, (organisation) => organisation.spaces)
    organisation!: Organisation;
  
    @OneToOne((type) => Media)
    @JoinColumn()
    media!: Media;
  }
  