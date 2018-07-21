import { Column } from "../../../../../lib/decorator/columns/Column";

export class Information {

    @Column({ name: "descr" })
    description: string;
}
