import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";

@Entity()
export class PostWithUpdateDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @UpdateDateColumn()
    updateDate: Date;

}