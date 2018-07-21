import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "@zuu/ferret";
import { Field, ObjectType } from "@zuu/owl";

@Entity()
@ObjectType()
export class Test extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Field()
    @Column()
    public code: number;

    public constructor() {
        super();
        this.code = Math.floor(Math.random() * 10000);
    }
}