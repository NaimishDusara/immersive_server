import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  import Experience from "./experience";
  import ExperienceShare from "./experienceShare";
//   import Collection from "./collection";
  import Media from "./media";
  
  @Entity()
  export default class User {
    // username
    @PrimaryColumn()
    sub!: string;
  
    @CreateDateColumn()
    created_at!: Date;
  
    @UpdateDateColumn()
    updated_at!: Date;
  
    // company
    @Column()
    name!: string;
  
    // first name
    @Column()
    given_name!: string;
  
    // surname
    @Column()
    family_name!: string;
  
    // avatar
    @OneToOne((type) => Media)
    @JoinColumn()
    media!: Media;
  
    // enabled
    @Column({ default: false })
    disabled!: boolean;
  
    // preferences
    @Column({ type: "jsonb", nullable: true })
    preferences!: string;
  
    // @ManyToMany((type) => Collection)
    // // Join table/columns were auto-generated
    // @JoinTable({
    //   name: "user_saved_collections_collection",
    //   joinColumn: {
    //     name: "userSub",
    //     referencedColumnName: "sub",
    //   },
    //   inverseJoinColumn: {
    //     name: "collectionId",
    //     referencedColumnName: "id",
    //   },
    // })
    // saved_collections: Collection[];
  
    @ManyToMany((type) => Experience)
    // Join table/columns were auto-generated
    @JoinTable({
      name: "user_saved_experiences_experience",
      joinColumn: {
        name: "userSub",
        referencedColumnName: "sub",
      },
      inverseJoinColumn: {
        name: "experienceId",
        referencedColumnName: "id",
      },
    })
    saved_experiences!: Experience[];
  
    @OneToMany(
      (type) => ExperienceShare,
      (expShare) => expShare.shared_to
    )
    experience_shares_to_me!: User[];
  }
  