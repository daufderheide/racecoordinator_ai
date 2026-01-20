import { Model } from "./model";

/**
 * A driver created by the user.  This model is 100% readonly and reflects the
 * driver as it exists in the database.
 */
export class Driver implements Model {
    readonly entity_id: string;
    readonly name: string;
    readonly nickname: string;

    constructor(entity_id: string, name: string, nickname: string) {
        this.entity_id = entity_id;
        this.name = name;
        this.nickname = nickname;
    }

    get objectId(): string {
        return this.entity_id;
    }
}   