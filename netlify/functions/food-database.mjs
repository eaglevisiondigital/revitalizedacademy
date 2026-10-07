import service from '../lib/food-database-service.cjs';
export default service.createHandler({env:name=>Netlify.env.get(name)});
