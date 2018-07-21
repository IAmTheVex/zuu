import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {ValueTransformer} from "../../../../../lib/decorator/options/ValueTransformer";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";

class TagTransformer implements ValueTransformer {

    to (value: string[]): string {
        return value.join(", ");
    }

    from (value: string): string[] {
        return value.split(", ");
    }

}

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: String, transformer: new TagTransformer() })
    tags: string[];

}
