import { User } from "../../model/entities/User";
import { Note } from "../../model/entities/Note";

export interface Context { 
    user?: User;
    note?: Note;
};