import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import {createHandler} from './handler.ts';
function caller(bearer?:string){const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');return createClient(Deno.env.get('SUPABASE_URL')!,keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false},...(bearer?{global:{headers:{Authorization:'Bearer '+bearer}}}:{})});}
Deno.serve(createHandler({verified:async token=>{const {data,error}=await caller().auth.getUser(token);return !error&&!!data.user?.email_confirmed_at;},claim:async(token,invitation)=>{const {error}=await caller(token).rpc('claim_onboarding_enrollment',{p_token:invitation});if(error)throw Error('Invitation unavailable');}}));
