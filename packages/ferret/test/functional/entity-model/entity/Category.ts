import {Entity} from "../../../../lib/decorator/entity/Entity";
import {BaseEntity} from "../../../../lib/repository/BaseEntity";
import {PrimaryGeneratedColumn} from "../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../lib/decorator/columns/Column";

@Entity()
export class Category  extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}