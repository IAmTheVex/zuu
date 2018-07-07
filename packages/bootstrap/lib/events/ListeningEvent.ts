import { AbstractEvent } from "@zuu/vet";
import { Application } from "express";
import { BootstrapEvents } from ".";

export class ListeningEvent extends AbstractEvent {
    public app: Application;

    constructor(app: Application) { 
        super(BootstrapEvents.LISTENING); 
        this.app = app;
    }   
}