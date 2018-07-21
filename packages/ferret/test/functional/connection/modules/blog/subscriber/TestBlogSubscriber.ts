import {EventSubscriber} from "../../../../../../lib/decorator/listeners/EventSubscriber";
import {EntitySubscriberInterface} from "../../../../../../lib/subscriber/EntitySubscriberInterface";
import {InsertEvent} from "../../../../../../lib/subscriber/event/InsertEvent";

@EventSubscriber()
export class TestBlogSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}