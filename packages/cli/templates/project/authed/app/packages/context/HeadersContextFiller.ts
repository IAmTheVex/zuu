import { UnresolvableResourceAccessError } from '../../errors/UnresolvableResourceAccessError';
import { UnauthorizedResourceAccessAttemptError } from "../../errors/UnauthorizedResourceAccessAttemptError";
import { User } from "../../model/entities/User";
import { Context } from "./Context";
import { Note } from "../../model/entities/Note";

export class HeadersContextFiller {
    public static async fill(user: User, headers: any): Promise<Object> {
        let context: Context = { };
        
        let noteId = headers["x-resource-note"];

        if(typeof noteId != "undefined") {
            let note = await Note.findOne(noteId);
            if(!note) throw new UnresolvableResourceAccessError("note", noteId);
            if((await note.user).id != user.id) throw new UnauthorizedResourceAccessAttemptError("note", noteId);
            context.note = note;
        }

        return context;
    }
}