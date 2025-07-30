import { Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity,
    UpdateDateColumn} from "typeorm";

export default abstract class Default{
    @PrimaryGeneratedColumn()
    id!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({
        select: false,
    })
    cognito_identity_id!: string;

    @Column({
        select:false
    })
    source_ip!: string;

    toObject(): Object{
        return JSON.parse(JSON.stringify(this));
    }
}