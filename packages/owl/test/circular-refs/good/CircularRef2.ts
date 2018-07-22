import { Field, ObjectType } from "../../../../lib";

import { CircularRef1 } from "./CircularRef1";

@ObjectType()
export class CircularRef2 {
  @Field(type => CircularRef1) ref1Field: any;
}
