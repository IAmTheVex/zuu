import {Entity} from "../../../../../lib/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../lib/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";
import {Column} from "../../../../../lib/decorator/columns/Column";
import {OneToMany} from "../../../../../lib/decorator/relations/OneToMany";
import {OneToOne} from "../../../../../lib/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../lib/decorator/relations/JoinColumn";
import {CategoryMetadata} from "./CategoryMetadata";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Post, post => post.category)
    posts: Post[];

    @Column({ type: "int", nullable: true })
    metadataId: number;
    
    @OneToOne(type => CategoryMetadata, metadata => metadata.category, {
        cascade: ["insert"]
    })
    @JoinColumn({ name: "metadataId" })
    metadata: CategoryMetadata;
    
    @Column()
    name: string;

}