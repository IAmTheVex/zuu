import { Application } from "express";

export interface IAfterHnadler {
    handleAfter(app: Application): Application;
}