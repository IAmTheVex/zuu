import { Application } from "express";

export interface IBeforeHnadler {
    handleBefore(app: Application): Application;
}