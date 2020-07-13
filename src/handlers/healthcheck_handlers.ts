import * as express from 'express';

import { HealthcheckService } from '../services/healthcheck_service';

export class HealthcheckHandlers {
    private readonly _healthcheckService: HealthcheckService;

    constructor(healthcheckService: HealthcheckService) {
        this._healthcheckService = healthcheckService;
    }

    public serveHealthcheck(_req: express.Request, res: express.Response): void {
        res.send(this._healthcheckService.getHealth());
    }
}
