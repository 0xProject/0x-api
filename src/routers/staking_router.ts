import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as asyncHandler from 'express-async-handler';
// tslint:disable-next-line:no-implicit-dependencies
import * as core from 'express-serve-static-core';

import { STAKING_PATH } from '../constants';
import { StakingHandlers } from '../handlers/staking_handlers';
import { errorHandler } from '../middleware/error_handling';
import { StakingDataService } from '../services/staking_data_service';

export const configureStakingHttpRouter = (app: core.Express, stakingDataService: StakingDataService): void => {
    app.use(cors());
    app.use(bodyParser.json());
    app.use(STAKING_PATH, createStakingRouter(stakingDataService));
    app.use(errorHandler);
};

function createStakingRouter(stakingDataService: StakingDataService): express.Router {
    const router = express.Router();
    const handlers = new StakingHandlers(stakingDataService);
    router.get('/pools/:id', asyncHandler(handlers.getStakingPoolByIdAsync.bind(handlers)));
    router.get('/pools', asyncHandler(handlers.getStakingPoolsAsync.bind(handlers)));
    router.get('/epochs', asyncHandler(handlers.getStakingEpochsAsync.bind(handlers)));
    router.get('/stats', asyncHandler(handlers.getStakingStatsAsync.bind(handlers)));
    router.get('/delegator/:id', asyncHandler(handlers.getDelegatorAsync.bind(handlers)));
    return router;
}
