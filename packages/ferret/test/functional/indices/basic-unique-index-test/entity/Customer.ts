import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Index} from "../../../../../lib/decorator/Index";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
@Index("index_name_english", ["nameEnglish"], { unique: true })
export class Customer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nameHebrew: string;

    @Column()
    nameEnglish: string;

}