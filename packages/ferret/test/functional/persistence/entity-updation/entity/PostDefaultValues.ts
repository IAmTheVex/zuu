import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
export class PostDefaultValues {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ default: "hello post" })
    text: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    addDate: Date;

    @Column({ default: 0 })
    views: number;

    @Column({ nullable: true })
    description: string;

}