import { create } from 'zustand';
import { api, setAccessToken } from '../api/client';

type User = { id:string; email:string; roles:string[]; employeeId?:string|null; name?:string|null };

type State = {
  user: User | null;
  token: string | null;
  login: (identifier:string,password:string)=>Promise<void>;
  logout: ()=>Promise<void>;
  loadMe: ()=>Promise<void>;
};

export const useAuth = create<State>((set)=>({
  user: null, token: null,
  login: async (identifier,password)=>{
    const { data } = await api.post('/auth/login', { identifier, password });
    setAccessToken(data.accessToken);
    set({ token: data.accessToken, user: data.user });
  },
  logout: async ()=>{
    await api.post('/auth/logout');
    setAccessToken(null);
    set({ token:null, user:null });
  },
  loadMe: async ()=>{
    try{
      const { data } = await api.get('/auth/me');
      set({ user: { id:data.id, email:data.email, roles: data.roles?.map((r:any)=>r.role.name)||[], employeeId: data.employee?.id, name: data.employee?.fullName }});
    }catch{}
  }
}));
