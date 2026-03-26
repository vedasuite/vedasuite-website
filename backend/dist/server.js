"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const app = (0, app_1.createApp)();
app.listen(env_1.env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`VedaSuite backend listening on port ${env_1.env.port}`);
});
