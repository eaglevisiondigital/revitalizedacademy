const path=require('node:path');
module.exports=(root,override=process.env.RVA_WAVE2_B_OUTPUT)=>override
  ?path.resolve(root,override)
  :path.join(root,'docs/orchestration/issue-54/wave2');
