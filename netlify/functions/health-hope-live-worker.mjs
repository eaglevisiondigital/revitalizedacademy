import {createHealthHopeApp} from './_shared/health-hope-live.mjs';
export default async (_request, context) => Response.json(await createHealthHopeApp(Netlify.env, {context}).worker());
// UTC polling only; actual session/reminder instants use America/New_York.
// Side effects require their independent runtime and database release flags.
export const config = {schedule: '* * * * *'};
