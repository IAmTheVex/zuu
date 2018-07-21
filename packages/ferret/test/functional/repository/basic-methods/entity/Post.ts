import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../lib/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number|undefined|null|string;

    @Column()
    title: string;

    @Column({
        type: "date",
        transformer: {
            from: (value: any) => new Date(value),
            to: (value: Date) => value.toISOString(),
        }
    })
    dateAdded: Date;
}