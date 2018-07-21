import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {CreateDateColumn} from "../../../../../lib/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column()
    text: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;

}