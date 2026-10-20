import {createHealthHopeApp} from './_shared/health-hope-live.mjs';
export default async (_request,context)=>Response.json(await createHealthHopeApp(Netlify.env,{context}).retention());
// Minutely UTC polling; calendar expiry uses America/New_York in PostgreSQL.
// Independent runtime and database flags default held. No email/Zoom operations.
export const config={schedule:'* * * * *'};
