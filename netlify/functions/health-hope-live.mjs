import {createHealthHopeApp} from './_shared/health-hope-live.mjs';
export default (request, context) => createHealthHopeApp(Netlify.env, {context}).handle(request);
export const config = {path: '/api/health-hope-live/:action'};
