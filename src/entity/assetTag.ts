import { JoinColumn, ManyToOne, Column, Entity } from "typeorm";

import Default from "./default";
import User from "./user";

@Entity()
export default class AssetTag extends Default {
  @Column()
  name!: string;

  @ManyToOne((type) => User)
  @JoinColumn()
  sub!: User;
}
