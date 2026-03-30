import 'dotenv/config';

import { createApp } from './app.mjs';

const app = createApp();
const port = Number(process.env.SERVER_PORT || 3002);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`StudySmart server running on http://localhost:${port}`);
});
