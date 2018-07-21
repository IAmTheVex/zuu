import {PrimaryColumn} from "../../../../../lib/decorator/columns/PrimaryColumn";
import {UpdateDateColumn} from "../../../../../lib/decorator/columns/UpdateDateColumn";
import {CreateDateColumn} from "../../../../../lib/decorator/columns/CreateDateColumn";
import {VersionColumn} from "../../../../../lib/decorator/columns/VersionColumn";

export class PostEmbedded {

    @PrimaryColumn()
    secondId: number;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;

    @VersionColumn()
    version: number;

}