import {EntitySubscriberInterface} from "../../../../lib/subscriber/EntitySubscriberInterface";
import {EventSubscriber} from "../../../../lib/decorator/listeners/EventSubscriber";
import {InsertEvent} from "../../../../lib/subscriber/event/InsertEvent";

@EventSubscriber()
export class SecondConnectionSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called after entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}