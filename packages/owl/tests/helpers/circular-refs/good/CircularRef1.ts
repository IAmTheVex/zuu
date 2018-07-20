import { Field, ObjectType } from "../../../../lib";

import { CircularRef2 } from "./CircularRef2";

@ObjectType()
export class CircularRef1 {
  @Field(type => CircularRef2) ref2Field: any;
}
