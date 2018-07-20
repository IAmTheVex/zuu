import { Field, ObjectType } from "../../../lib";

@ObjectType()
export class SampleObject {
  @Field() sampleField: string;
}
