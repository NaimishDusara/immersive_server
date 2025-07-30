import { Column, Entity, ManyToOne, OneToOne, OneToMany, JoinTable, ManyToMany, JoinColumn } from "typeorm";
// import Category from "./category";
import Default from "./default";
import ExperienceLock from "./experienceLock";
import ExperienceType from "./experienceType";
import ExperienceShare from "./experienceShare";
// import Like from "./like";
import Layout from "./layout";
import Media from "./media";
import Organisation from "./organisation";
import Space from "./space";
import Tag from "./tag";
import Privacy from "../enum-privacy";
import User from "./user";
import Attribute from "./attribute";

@Entity()
export default class Experience extends Default {
  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ enum: Privacy })
  privacy!: Privacy;

  @Column({ default: false })
  editable_by_own_org!: boolean;

  @Column({ enum: Privacy, nullable: true, default: Privacy.PUBLIC })
  can_clone!: Privacy;

  @OneToOne((type) => ExperienceLock, (lock) => lock.experience)
  lock!: ExperienceLock;

  @OneToMany((type) => ExperienceShare, (expShare) => expShare.experience)
  shares!: ExperienceShare[];

//   @ManyToOne((type) => Category)
//   @JoinColumn()
//   category: Category;

  @ManyToOne((type) => ExperienceType)
  @JoinColumn()
  experienceType!: ExperienceType;

  @ManyToMany((type) => Tag)
  @JoinTable()
  tags!: Tag[];

//   @OneToMany((type) => Like, (like) => like.experience)
//   likes!: Like[];

  @Column("json")
  json!: string;

  @ManyToOne((type) => Layout)
  @JoinColumn()
  layout!: Layout;

  @ManyToOne((type) => Space)
  @JoinColumn()
  space!: Space;

  @ManyToOne((type) => Media)
  @JoinColumn()
  media!: Media;

  @OneToOne((type) => Media)
  @JoinColumn()
  screenshot_1!: Media;

  @OneToOne((type) => Media)
  @JoinColumn()
  screenshot_2!: Media;

  @OneToOne((type) => Media)
  @JoinColumn()
  screenshot_3!: Media;

  @OneToOne((type) => Media)
  @JoinColumn()
  screenshot_4!: Media;

  @OneToOne((type) => Media)
  @JoinColumn()
  attachment!: Media;

  @ManyToOne((type) => User)
  @JoinColumn()
  sub!: User;

  @ManyToOne((type) => Organisation, (organisation) => organisation.experiences)
  organisation!: Organisation;

  @ManyToMany((type) => User)
  @JoinTable({
    name: "user_saved_experiences_experience",
    joinColumn: {
      name: "experienceId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "userSub",
      referencedColumnName: "sub",
    },
  })
  user_saved!: Experience[];

  @Column({ nullable: true })
  date_took_place!: Date;

  @Column({ nullable: true, type: "float8" })
  location_lat!: number;

  @Column({ nullable: true, type: "float8" })
  location_long!: number;

  @ManyToMany((type) => Attribute)
  @JoinTable()
  attributes!: Attribute[];

  @Column("simple-array", { nullable: true })
  languages!: string[];
}
