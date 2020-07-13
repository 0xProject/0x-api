export class HealthcheckService {
    private _isHealthy: boolean;
    constructor() {
        this._isHealthy = true;
    }

    public setHealth(val: boolean): void {
        this._isHealthy = val;
    }

    public isHealthy(): boolean {
        return this._isHealthy;
    }
}
