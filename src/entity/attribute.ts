import { Column, Entity } from "typeorm";

import Default from "./default";

@Entity()
export default class Attribute extends Default {
  @Column()
  name!: string;
}
