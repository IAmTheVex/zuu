import {Column, Entity, PrimaryGeneratedColumn} from "../../../../../lib";
import {Index} from "../../../../../lib/decorator/Index";

@Index(["name", "text"], { where: `"name" IS NOT NULL AND "text" IS NOT NULL` })
@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    text: string;

    @Index({ where: `"version" IS NOT NULL AND "version" > 0` })
    @Column()
    version: number;

}