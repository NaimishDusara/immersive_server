import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";

import Default from "./default";
import Media from "./media";
import User from "./user";


@Entity()
export default class TemplateFile extends Default {
  @Column()
  name!: string;

  @OneToOne((type) => Media)
  @JoinColumn()
  file!: Media;

  @ManyToOne((type) => User)
  @JoinColumn()
  sub!: User;
}
