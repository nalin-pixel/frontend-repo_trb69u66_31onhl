import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_BACKEND_URL || ''

function useI18n(lang) {
  const [strings, setStrings] = useState({})
  useEffect(() => {
    fetch(`${API}/i18n?lang=${lang || 'en'}`)
      .then(r => r.json())
      .then(setStrings)
      .catch(() => setStrings({}))
  }, [lang])
  return strings
}

function AuthPage({ setUser }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', language: 'en' })
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (mode === 'signup') {
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (!res.ok) { alert('Signup failed'); return }
    }
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password })
    })
    if (!res.ok) { alert('Login failed'); return }
    const data = await res.json()
    const user = { id: data.user_id, name: data.name, language: data.language }
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-6" style={{backgroundImage:'url(https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&w=1600&q=60)', backgroundSize:'cover'}}>
      <div className="backdrop-blur bg-white/80 w-full max-w-md rounded-xl shadow-xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-blue-700 text-center">Deepneumoscan</h1>
        <div className="flex gap-2 justify-center text-sm">
          <button className={`px-3 py-1 rounded ${mode==='login'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('login')}>Login</button>
          <button className={`px-3 py-1 rounded ${mode==='signup'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setMode('signup')}>Sign up</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode==='signup' && (
            <input className="w-full border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          )}
          <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input type="password" className="w-full border p-2 rounded" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          {mode==='signup' && (
            <select className="w-full border p-2 rounded" value={form.language} onChange={e=>setForm({...form, language:e.target.value})}>
              <option value="en">English</option>
              <option value="kn">Kannada</option>
            </select>
          )}
          <button className="w-full bg-blue-600 text-white rounded py-2">{mode==='login'? 'Login':'Create account'}</button>
        </form>
      </div>
    </div>
  )
}

function Navbar({ user, lang, setLang }) {
  const strings = useI18n(lang)
  return (
    <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur sticky top-0 z-10 shadow">
      <div className="font-bold text-blue-700">{strings.app_name || 'Deepneumoscan'}</div>
      <div className="flex items-center gap-2">
        <select className="border p-1 rounded" value={lang} onChange={e=>setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="kn">Kannada</option>
        </select>
        <Link to="/history" className="text-blue-700">{strings.history || 'History'}</Link>
      </div>
    </div>
  )
}

function Home({ user, lang }) {
  const strings = useI18n(lang)
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">{(strings.welcome || 'Welcome, {name}').replace('{name}', user?.name || '')}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/self" className="p-4 rounded-xl bg-white shadow hover:shadow-md">{strings.self_assessment || 'Self Assessment'}</Link>
        <Link to="/scan" className="p-4 rounded-xl bg-white shadow hover:shadow-md">{strings.xray_scan || 'Chest X-ray Scan'}</Link>
        <Link to="/hospitals" className="p-4 rounded-xl bg-white shadow hover:shadow-md">{strings.hospital_tracker || 'Hospital Tracker'}</Link>
        <Link to="/cure" className="p-4 rounded-xl bg-white shadow hover:shadow-md">{strings.cure_assessment || 'Curing Assessment'}</Link>
        <Link to="/history" className="p-4 rounded-xl bg-white shadow hover:shadow-md">{strings.history || 'History'}</Link>
      </div>
    </div>
  )
}

function SelfAssessment() {
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [answers, setAnswers] = useState([
    { q:'Fever', score:0 },
    { q:'Cough', score:0 },
    { q:'Shortness of breath', score:0 },
    { q:'Chest pain', score:0 },
  ])
  const [result, setResult] = useState(null)
  const lang = user.language || 'en'
  const strings = useI18n(lang)
  const submit = async ()=>{
    const res = await fetch(`${API}/assessment/self`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user_id:user.id, answers})})
    const data = await res.json(); setResult(data)
  }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{strings.self_assessment || 'Self Assessment'}</h2>
      {answers.map((a,i)=> (
        <div key={i} className="flex items-center gap-3 bg-white p-3 rounded shadow">
          <div className="flex-1">{a.q}</div>
          <input type="range" min="0" max="3" value={a.score} onChange={e=>{
            const v = parseInt(e.target.value); const copy=[...answers]; copy[i].score=v; setAnswers(copy)
          }} />
          <div className="w-6 text-center">{a.score}</div>
        </div>
      ))}
      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <div>Prediction: {result.predicted_condition}</div>
          <div>Confidence: {(result.confidence*100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  )
}

function ScanPage(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [form, setForm] = useState({name:'', age:'', gender:'male', medical_condition:''})
  const [file, setFile] = useState(null)
  const [res, setRes] = useState(null)
  const strings = useI18n(user.language || 'en')

  const submit = async ()=>{
    if(!file){ alert('Upload JPEG'); return }
    const fd = new FormData()
    fd.append('file', file)
    Object.entries(form).forEach(([k,v])=> fd.append(k, v))
    const r = await fetch(`${API}/scan/xray`, { method:'POST', body: fd })
    const data = await r.json(); setRes(data)
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">{strings.xray_scan || 'Chest X-ray Scan'}</h2>
      <p className="text-sm text-gray-600">{strings.upload_precautions || ''}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input className="border p-2 rounded" placeholder="Age" type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} />
        <select className="border p-2 rounded" value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input className="border p-2 rounded" placeholder="Medical condition" value={form.medical_condition} onChange={e=>setForm({...form, medical_condition:e.target.value})} />
        <input type="file" accept="image/jpeg" onChange={e=>setFile(e.target.files?.[0])} className="col-span-2" />
      </div>
      <button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded">Analyze</button>
      {res && (
        <div className="space-y-2">
          <div className="p-3 bg-white rounded shadow">Prediction: {res.prediction} • Confidence: {(res.confidence*100).toFixed(1)}% • Model: {res.model}</div>
          {res.annotated_image_b64 && <img src={`data:image/jpeg;base64,${res.annotated_image_b64}`} className="rounded border" />}
        </div>
      )}
    </div>
  )
}

function CureAssessment(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [symptoms, setSymptoms] = useState([
    {date: new Date().toISOString().slice(0,10), score: 2},
  ])
  const [res, setRes] = useState(null)
  const strings = useI18n(user.language || 'en')

  const add = ()=> setSymptoms([...symptoms, {date:'', score:0}])
  const submit = async ()=>{
    const r = await fetch(`${API}/assessment/cure`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user_id:user.id, symptoms}) })
    const d = await r.json(); setRes(d)
  }

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">{strings.cure_assessment || 'Curing Assessment'}</h2>
      {symptoms.map((s,i)=> (
        <div key={i} className="flex gap-2 items-center bg-white p-3 rounded shadow">
          <input className="border p-2 rounded flex-1" placeholder="Date" value={s.date} onChange={e=>{const c=[...symptoms]; c[i].date=e.target.value; setSymptoms(c)}} />
          <input type="number" className="border p-2 rounded w-28" placeholder="Score" value={s.score} onChange={e=>{const c=[...symptoms]; c[i].score=parseFloat(e.target.value||0); setSymptoms(c)}} />
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={add} className="px-3 py-2 rounded bg-gray-100">Add</button>
        <button onClick={submit} className="px-3 py-2 rounded bg-blue-600 text-white">Evaluate</button>
      </div>
      {res && <div className="p-3 bg-white rounded shadow">Status: {res.evaluation} • Change: {res.score_change}</div>}
    </div>
  )
}

function History(){
  const user = JSON.parse(localStorage.getItem('user')||'{}')
  const [items, setItems] = useState([])
  const load = async ()=>{
    const r = await fetch(`${API}/history/${user.id}`); const d = await r.json(); setItems(d.items||[])
  }
  useEffect(()=>{ load() },[])
  const del = async (id)=>{ await fetch(`${API}/history/${id}`, {method:'DELETE'}); load() }
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">History</h2>
      {items.map(it=> (
        <div key={it._id} className="bg-white p-3 rounded shadow flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">{it.type}</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(it.data, null, 2)}</pre>
          </div>
          <button onClick={()=>del(it._id)} className="text-red-600">Delete</button>
        </div>
      ))}
    </div>
  )
}

function Hospitals(){
  const strings = useI18n('en')
  const [pos, setPos] = useState(null)
  const [q, setQ] = useState('hospital')

  useEffect(()=>{
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition((p)=> setPos({lat:p.coords.latitude, lng:p.coords.longitude}))
    }
  },[])

  const googleQuery = pos ? `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${pos.lat},${pos.lng},15z` : `https://www.google.com/maps/search/${encodeURIComponent(q)}`

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">{strings.hospital_tracker || 'Hospital Tracker'}</h2>
      <input className="border p-2 rounded" value={q} onChange={e=>setQ(e.target.value)} />
      <a className="inline-block bg-blue-600 text-white px-3 py-2 rounded" href={googleQuery} target="_blank">{strings.get_directions || 'Get Directions'}</a>
      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
        <iframe title="map" src={googleQuery} className="w-full h-full border-0"></iframe>
      </div>
    </div>
  )
}

function Layout(){
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('user')||'null'))
  const [lang, setLang] = useState(user?.language || 'en')
  useEffect(()=>{ if(user){ localStorage.setItem('user', JSON.stringify({...user, language: lang})) } }, [lang])
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50" style={{backgroundImage:'url(https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?auto=format&fit=crop&w=1600&q=60)', backgroundSize:'cover'}}>
      <Navbar user={user} lang={lang} setLang={setLang} />
      <Routes>
        <Route path="/" element={<AuthPage setUser={setUser} />} />
        <Route path="/home" element={<Home user={user} lang={lang} />} />
        <Route path="/self" element={<SelfAssessment />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/cure" element={<CureAssessment />} />
        <Route path="/history" element={<History />} />
        <Route path="/hospitals" element={<Hospitals />} />
      </Routes>
    </div>
  )
}

export default function App(){
  return <Layout />
}
