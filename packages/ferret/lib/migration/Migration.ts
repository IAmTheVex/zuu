import {MigrationInterface} from "./MigrationInterface";

/**
 * Represents entity of the migration in the database.
 */
export class Migration {

    
    
    

    /**
     * Migration id.
     * Indicates order of the executed migrations.
     */
    id: number|undefined;

    /**
     * Timestamp of the migration.
     */
    timestamp: number;

    /**
     * Name of the migration (class name).
     */
    name: string;

    /**
     * Migration instance that needs to be run.
     */
    instance?: MigrationInterface;

    
    // Constructor
    

    constructor(id: number|undefined, timestamp: number, name: string, instance?: MigrationInterface) {
        this.id = id;
        this.timestamp = timestamp;
        this.name = name;
        this.instance = instance;
    }

}