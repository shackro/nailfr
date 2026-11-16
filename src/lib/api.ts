import { hasSupabaseConfig } from './supabase';
import { supabaseApi } from './supabaseApi';

const BASE=import.meta.env.VITE_API_URL || '/api';

export async function api<T>(path:string, init?:RequestInit):Promise<T>{
 if(hasSupabaseConfig) return supabaseApi<T>(path,init);
 const token=sessionStorage.getItem('glamourglow-admin-token');
 const res=await fetch(`${BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...init?.headers}});
 if(!res.ok) throw new Error(`Request failed (${res.status})`);
 if(!res.headers.get('content-type')?.includes('application/json')) {
   throw new Error(`The API at ${BASE} did not return JSON. Set VITE_API_URL to the deployed FastAPI URL, including /api.`);
 }
 return res.json();
}
