import {
    Column,
    Entity,
    ManyToMany,
    ManyToOne,
    OneToOne,
    JoinColumn,
    JoinTable,
  } from "typeorm";
  
  import Default from "./default";
  import AssetTag from "./assetTag";
  import Media from "./media";
  import Organisation from "./organisation";
  
  import AssetType from "../enum-asset-type";
  import Privacy from "../enum-privacy";
  import User from "./user";
  
  @Entity()
  export default class Asset extends Default {
    @Column({ enum: Privacy })
    privacy!: Privacy;
  
    @Column({ enum: AssetType })
    type!: AssetType;
  
    @Column({ nullable: true })
    source!: string;
  
    @Column({ nullable: true })
    source_url!: string;
  
    @OneToOne((type) => Media)
    @JoinColumn()
    media!: Media;
  
    @OneToOne((type) => Media)
    @JoinColumn()
    media_original!: Media;
  
    @ManyToMany((type) => AssetTag)
    @JoinTable()
    tags!: AssetTag;
  
    @ManyToOne((type) => User)
    @JoinColumn()
    sub!: User;
  
    @ManyToOne((type) => Organisation, (organisation) => organisation.experiences)
    organisation!: Organisation;
  }
  