import {EventSubscriber} from "../../../../../../lib/decorator/listeners/EventSubscriber";
import {EntitySubscriberInterface} from "../../../../../../lib/subscriber/EntitySubscriberInterface";
import {InsertEvent} from "../../../../../../lib/subscriber/event/InsertEvent";

@EventSubscriber()
export class TestQuestionSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}