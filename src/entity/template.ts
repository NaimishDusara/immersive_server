import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";


import TemplateType from "../enum-template-type";
import Default from "./default";
import Media from "./media";
import TemplateFile from "./templateFile";
import User from "./user";


@Entity()
export default class Template extends Default{
    @Column()
    name!: string;

    @Column({nullable:true})
    editorDirectory!: string;

    @Column({enum: TemplateType})
    type!: TemplateType;

    @Column({ default: false })
    hasHotspots!: boolean;

    @OneToOne((type) => Media)
    @JoinColumn()
    thumbnail!: Media;

    @ManyToOne((type) => TemplateFile)
    @JoinColumn()
    templateFile!: TemplateFile;

    @OneToOne((type) => Media)
    @JoinColumn()
    file!: Media;

    @Column("json")
    defaultConfig!: string;

    @ManyToOne((type) => User)
    @JoinColumn()
    sub!: User;

    @Column({ length: 100, nullable: true })
    version!: string;

    @Column({ default: false })
    disabled!: boolean;

    @Column({ nullable: true })
    featured!: boolean;
  





}
