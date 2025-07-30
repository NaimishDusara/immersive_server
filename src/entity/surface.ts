import { OneToOne, Column, Entity, ManyToOne, JoinColumn } from "typeorm";

import Default from "./default";
import Layout from "./layout";
import User from "./user";
// import { float } from "aws-sdk/clients/cloudfront";
// import { int } from "aws-sdk/clients/datapipeline";

@Entity()
export default class Surface extends Default {
  @Column()
  position!: number;

  @Column()
  dimensions!: string;

  @Column()
  wide!: boolean;

  @Column({ nullable: true, type: "float8" })
  physicalAspectRatio!: number;

  @Column({ nullable: true })
  surfaceDivisions!: number;

  @ManyToOne((type) => User)
  @JoinColumn()
  sub!: User;

  @ManyToOne((type) => Layout, (layout) => layout.surfaces)
  layout!: Layout;
}
