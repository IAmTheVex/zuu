import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, Index } from "@zuu/ferret";

@Entity()
export class Token extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @Column({
        nullable: true
    })
    @Index()
    public chars: string;

    @Column()
    public scope: number;

    @Column()
    @Index()
    public target: string;
}