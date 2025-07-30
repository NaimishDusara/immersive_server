import { Column, Entity, OneToMany, OneToOne, JoinColumn } from "typeorm";

import Default from "./default";
import Space from "./space";
// import Collection from "./collection";
import Experience from "./experience";
import Media from "./media";
import User from "./user";

@Entity()
export default class Organisation extends Default {
  @Column({ unique: true })
  name!: string;

  @Column({
    select: false,
    default: true,
  })
  can_delete!: boolean;

  @Column({nullable: true})
  max_users!: number;

  @Column({ default: false })
  show_bespoke!: boolean;

  @OneToMany((type) => Media, (media) => media.organisation)
  media!: Media[];

  @OneToMany((type) => Space, (space) => space.organisation)
  spaces!: Space[];

//   @OneToMany((type) => Collection, (collection) => collection.organisation)
//   collections: Collection[];

  @OneToMany((type) => Experience, (experience) => experience.organisation)
  experiences!: Experience[];

  @Column({ default: false })
  require_mfa!: boolean;
}
