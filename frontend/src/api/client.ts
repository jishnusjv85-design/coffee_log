import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true
});

let accessToken: string | null = null;
export const setAccessToken = (t:string|null)=> { accessToken=t };

api.interceptors.request.use(cfg=>{
  if(accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing=false;
api.interceptors.response.use(r=>r, async err=>{
  const original = err.config;
  if(err.response?.status===401 && !original._retry){
    original._retry=true;
    if(!refreshing){
      refreshing=true;
      try{
        const { data } = await axios.post((import.meta.env.VITE_API_URL||'http://localhost:4000/api')+'/auth/refresh', {}, { withCredentials:true });
        setAccessToken(data.accessToken);
        refreshing=false;
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      }catch(e){ refreshing=false; setAccessToken(null); window.location.href='/login'; throw e;}
    }
  }
  throw err;
});
