import express from 'express';
import sinon from 'sinon';
import axios from 'axios';
import schoolRouter from '../../../src/modules/schools/routes';

// Stub axios.get globally for all API calls
sinon.stub(axios, 'get').resolves({
  data: {
    main: { temp: 25, feels_like: 26, humidity: 60 },
    clouds: { all: 20 },
    list: [
      {
        dt_txt: new Date().toISOString(),
        main: { temp: 25, feels_like: 26, humidity: 60 },
        clouds: { all: 20 },
      },
    ],
  },
});

export function buildAuthTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use('/api/v1', schoolRouter);
  return app;
}
