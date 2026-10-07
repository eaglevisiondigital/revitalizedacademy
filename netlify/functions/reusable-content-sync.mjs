import service from '../lib/content-sync-service.cjs';
export default service.createHandler({env:name=>Netlify.env.get(name)});
