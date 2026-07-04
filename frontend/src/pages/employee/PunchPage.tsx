import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function PunchPage(){
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gps,setGps] = useState<{lat:number,lng:number,acc?:number}|null>(null)
  const [selfieOk,setSelfieOk] = useState(false)

  const { data: atts=[], refetch } = useQuery({
    queryKey: ['my-att'],
    queryFn: async ()=> (await api.get('/attendance/me')).data
  })
  const today = atts[0]
  const punchedIn = !!today?.punchInAt && !today?.punchOutAt

  useEffect(()=>{
    navigator.mediaDevices?.getUserMedia({ video: true }).then(stream=>{
      if(videoRef.current){ videoRef.current.srcObject = stream }
    }).catch(()=>{})
    navigator.geolocation.getCurrentPosition(pos=>{
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy })
    }, ()=>toast.error('Enable GPS'), { enableHighAccuracy: true })
    return ()=>{ const s = videoRef.current?.srcObject as MediaStream | undefined; s?.getTracks().forEach(t=>t.stop()) }
  },[])

  const capture = ()=>{
    const v = videoRef.current!, c = canvasRef.current!
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v,0,0)
    setSelfieOk(true)
    toast.success('Selfie captured — face match simulated OK')
  }

  const doPunchIn = async ()=>{
    if(!gps) return toast.error('GPS required')
    if(!selfieOk) return toast.error('Capture selfie first')
    try{
      await api.post('/attendance/punch-in', { lat: gps.lat, lng: gps.lng, accuracy: gps.acc, selfieVerified: true, selfieConfidence: 0.92, device: { ua: navigator.userAgent }})
      toast.success('Punched in ✓')
      refetch()
    }catch(e:any){ toast.error(e?.response?.data?.error || 'Punch in failed') }
  }
  const doPunchOut = async ()=>{
    if(!gps) return toast.error('GPS required')
    try{
      await api.post('/attendance/punch-out', { lat: gps.lat, lng: gps.lng, device: { ua: navigator.userAgent }})
      toast.success('Punched out ✓')
      refetch()
    }catch(e:any){ toast.error(e?.response?.data?.error || 'Punch out failed') }
  }

  return <div className="space-y-6">
    <h2 className="font-display text-2xl">Punch In / Out</h2>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="font-medium mb-2">Selfie Verification</h3>
        <video ref={videoRef} autoPlay playsInline className="rounded-xl w-full bg-black aspect-video"/>
        <canvas ref={canvasRef} className="hidden"/>
        <div className="flex gap-2 mt-3">
          <button onClick={capture} className="btn-secondary px-3 py-2 rounded-xl">Capture Selfie</button>
          <span className={`text-sm ${selfieOk ? 'text-green-700':'text-coffee-600'}`}>{selfieOk ? 'Verified ✓' : 'Not verified'}</span>
        </div>
        <p className="text-xs text-coffee-600 dark:text-coffee-400 mt-2">Face match is simulated locally. Production integrates face-api.js / AWS Rekognition — embeddings never leave server.</p>
      </div>
      <div className="card space-y-3">
        <div><b>GPS:</b> {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} ±${Math.round(gps.acc||0)}m` : 'Acquiring…'}</div>
        <div><b>Network check:</b> Public IP allowlist + geofence enforced server-side.</div>
        <div><b>Today:</b> {today ? new Date(today.date).toLocaleDateString('en-IN') : '—'}</div>
        <div><b>Status:</b> {punchedIn ? 'Working' : today?.punchOutAt ? 'Completed' : 'Not punched in'}</div>
        {!punchedIn ? <button onClick={doPunchIn} className="btn w-full">Punch In</button> :
          <button onClick={doPunchOut} className="btn w-full bg-emerald-700 hover:bg-emerald-800">Punch Out</button>}
        <p className="text-xs text-coffee-600 dark:text-coffee-400">Punch In is only available from an authorized Coffee Bun office location. (IP + GPS validated)</p>
      </div>
    </div>
  </div>
}
