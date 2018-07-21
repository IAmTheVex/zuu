import {BeforeInsert} from "../../../../../../lib/decorator/listeners/BeforeInsert";
import {Entity} from "../../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../lib/decorator/columns/Column";
import {AfterRemove} from "../../../../../../lib/decorator/listeners/AfterRemove";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    isRemoved: boolean = false;

    @BeforeInsert()
    beforeInsert() {
        this.title += "!";
    }

    @AfterRemove()
    afterRemove() {
        this.isRemoved = true;
    }

}