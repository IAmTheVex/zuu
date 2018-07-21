import { Resolver, Query, Ctx, Arg, Mutation } from "@zuu/owl";
import { Note } from "../model/entities/Note";
import { User } from '../model/entities/User';
import { RequiredResourceNotProvidedError } from "../errors/RequiredResourceNotProvidedError";

@Resolver()
export class NoteResolver {

    @Query(returns => [Note])
    public async notes(
        @Ctx("user") user: User
    ): Promise<Note[]> {
        return (await user.notes) || [];
    }

    @Mutation(returns => Note)
    public async createNote(
        @Ctx("user") user: User,
        @Arg("text") text: string
    ): Promise<Note> {
        let note = new Note();
        note.text = text;
        note.user = user;
        await note.save();
        
        await user.save();

        return note;
    }

    @Mutation(returns => Boolean)
    public async removeNote(
        @Ctx("note") note: Note
    ): Promise<boolean> {
        if(!note) throw new RequiredResourceNotProvidedError("note");

        await note.remove();
        return true;
    }

    @Mutation(returns => Note)
    public async editNote(
        @Ctx("note") note: Note,
        @Arg("text") text: string
    ): Promise<Note> {
        if(!note) throw new RequiredResourceNotProvidedError("note");
        
        note.text = text;
        await note.save();
        
        return note;
    }
}