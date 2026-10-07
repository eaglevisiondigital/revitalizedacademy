import dataset from '../private-repdb/exercises.json' with {type:'json'};
import service from '../lib/exercise-library-service.cjs';
// esbuild embeds licensed data inside the protected function, never static output.
export default service.createHandler({env:name=>Netlify.env.get(name),rows:dataset.exercises});
