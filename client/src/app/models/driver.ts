/**
 * A driver created by the user.  This model is 100% readonly and reflects the
 * driver as it exists in the database.
 */
export class Driver {
    readonly name: string;
    readonly nickname: string;

    constructor(name: string, nickname: string) {
        this.name = name;
        this.nickname = nickname;
    }
}   