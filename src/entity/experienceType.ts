import { Column, Entity } from "typeorm";

import Default from "./default";

@Entity()
export default class ExperienceType extends Default {
  @Column()
  name!: string;
}