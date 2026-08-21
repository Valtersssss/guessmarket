'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from './lib/supabase'
import { Car, Building2, Key, Briefcase, Smartphone, MapPin, Dice5, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Clock, LayoutGrid, Users, User, Copy, Check, Calendar, Gauge, Fuel, Settings2, Ruler, Layers, Palette, ShieldCheck } from 'lucide-react'

const ROUNDS_COUNT = 5
const TIMER_OPTIONS = [
  { key: 15, label: '15s' },
  { key: 30, label: '30s' },
  { key: 45, label: '45s' },
  { key: 60, label: '60s' },
  { key: 0, label: 'Bez laika' },
]

const CATEGORY_ICONS = {
  auto: Car,
  dzīvoklis_pārdošana: Building2,
  dzīvoklis_īre: Key,
  darbs: Briefcase,
  elektronika: Smartphone,
  zeme: MapPin,
}

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Visas', icon: LayoutGrid },
  { key: 'auto', label: 'Auto', icon: Car },
  { key: 'dzīvoklis_pārdošana', label: 'Dzīvokļi', icon: Building2 },
  { key: 'zeme', label: 'Zeme', icon: MapPin },
]

// Prioritātes secība - svarīgākie lauki vispirms (pēc atslēgvārda meklēšanas nosaukumā)
const SPEC_PRIORITY = [
  'gads', 'izlaiduma',
  'nobraukum',
  'motors', 'dzinēj',
  'ātrumkārb',
  'istabas', 'ist.',
  'platība',
  'stāv',
  'sērija',
  'virsbūv',
  'krāsa',
  'tehniskā apskate',
]

const SPEC_ICONS = [
  { match: ['gads', 'izlaiduma'], icon: Calendar },
  { match: ['nobraukum'], icon: Gauge },
  { match: ['motors', 'dzinēj'], icon: Fuel },
  { match: ['ātrumkārb'], icon: Settings2 },
  { match: ['platība', 'm²'], icon: Ruler },
  { match: ['stāv'], icon: Layers },
  { match: ['krāsa'], icon: Palette },
  { match: ['tehniskā apskate'], icon: ShieldCheck },
]

function getSpecIcon(label) {
  const lower = label.toLowerCase()
  const found = SPEC_ICONS.find((entry) => entry.match.some((m) => lower.includes(m)))
  return found ? found.icon : Dice5
}

function sortSpecs(specEntries) {
  return [...specEntries].sort((a, b) => {
    const aIndex = SPEC_PRIORITY.findIndex((p) => a[0].toLowerCase().includes(p))
    const bIndex = SPEC_PRIORITY.findIndex((p) => b[0].toLowerCase().includes(p))
    const aRank = aIndex === -1 ? 999 : aIndex
    const bRank = bIndex === -1 ? 999 : bIndex
    return aRank - bRank
  })
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || Dice5
}

function calculateScore(guess, correctPrice) {
  const diff = Math.abs(guess - correctPrice)
  const errorRatio = diff / correctPrice
  const score = Math.round(Math.max(0, 100 - errorRatio * 100))
  return score
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function Home() {
  // 'menu' | 'solo-setup' | 'create-room' | 'room-created' | 'game'
  const [mode, setMode] = useState('menu')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTimer, setSelectedTimer] = useState(30)
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [guess, setGuess] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [lastRoundScore, setLastRoundScore] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)
  const [animateIn, setAnimateIn] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(selectedTimer)
  const guessRef = useRef(guess)
  const revealedRef = useRef(revealed)

  useEffect(() => {
    guessRef.current = guess
  }, [guess])

  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  async function startSoloGame() {
    setLoadingQuestions(true)
    let query = supabase.from('questions').select('*')

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }

    const { data, error } = await query

    if (error) {
      console.error('Kļūda ielādējot jautājumus:', error)
    } else {
      const shuffled = [...data].sort(() => Math.random() - 0.5)
      setQuestions(shuffled.slice(0, ROUNDS_COUNT))
      setMode('game')
    }
    setLoadingQuestions(false)
  }

  async function handleCreateRoom() {
    if (!playerName.trim()) return
    setCreatingRoom(true)
    setRoomError('')

    const code = generateRoomCode()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ code, status: 'lobby', max_rounds: ROUNDS_COUNT })
      .select()
      .single()

    if (roomErr) {
      console.error(roomErr)
      setRoomError('Neizdevās izveidot istabu. Mēģini vēlreiz.')
      setCreatingRoom(false)
      return
    }

    const { error: playerErr } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: playerName.trim(), is_host: true })

    if (playerErr) {
      console.error(playerErr)
      setRoomError('Neizdevās pievienoties istabai. Mēģini vēlreiz.')
      setCreatingRoom(false)
      return
    }

    setRoomCode(code)
    setMode('room-created')
    setCreatingRoom(false)
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  useEffect(() => {
    setAnimateIn(false)
    setPhotoIndex(0)
    setTimeLeft(selectedTimer)
    const t = setTimeout(() => setAnimateIn(true), 20)
    return () => clearTimeout(t)
  }, [currentIndex, selectedTimer])

  useEffect(() => {
    if (mode !== 'game' || questions.length === 0 || gameFinished) return
    if (selectedTimer === 0) return

    const interval = setInterval(() => {
      if (revealedRef.current) return

      setTimeLeft((prev) => {
        if (prev <= 1) {
          const finalGuess = guessRef.current || '0'
          const question = questions[currentIndex]
          const score = calculateScore(Number(finalGuess), question.correct_price)
          setGuess(finalGuess)
          setLastRoundScore(score)
          setTotalScore((s) => s + score)
          setRevealed(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, questions, gameFinished, mode, selectedTimer])

  // --- GALVENĀ IZVĒLNE ---
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Cikmaksā.lv</h1>
            <p className="text-slate-500 text-sm">Uzmini reālu SS.LV sludinājumu cenas</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col gap-3">
            <button
              onClick={() => setMode('solo-setup')}
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-orange-500" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Spēlēt solo</p>
                <p className="text-slate-500 text-xs">Trenējies viens pats</p>
              </div>
            </button>

            <button
              onClick={() => setMode('create-room')}
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl p-4 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-orange-500" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">Izveidot istabu</p>
                <p className="text-slate-500 text-xs">Spēlē ar draugiem</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- SOLO: kategorijas un laika izvēle ---
  if (mode === 'solo-setup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Cikmaksā.lv</h1>
            <p className="text-slate-500 text-sm">Uzmini reālu SS.LV sludinājumu cenas</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <p className="text-slate-700 text-sm font-semibold mb-3">Izvēlies kategoriju</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {CATEGORY_FILTERS.map((cat) => {
                const CatIcon = cat.icon
                const isSelected = selectedCategory === cat.key
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex flex-col items-center gap-2 rounded-2xl py-5 border-2 transition-all ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <CatIcon className="w-6 h-6" strokeWidth={2.2} />
                    <span className="text-sm font-semibold">{cat.label}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-slate-700 text-sm font-semibold mb-3">Laiks vienam raundam</p>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = selectedTimer === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedTimer(opt.key)}
                    className={`rounded-xl py-3 border-2 transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <button
              onClick={startSoloGame}
              disabled={loadingQuestions}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.98]"
            >
              {loadingQuestions ? 'Ielādē...' : 'Sākt spēli'}
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-2 text-slate-400 hover:text-slate-600 font-semibold text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- ISTABAS IZVEIDE: vārda ievade ---
  if (mode === 'create-room') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Cikmaksā.lv</h1>
            <p className="text-slate-500 text-sm">Izveido istabu un uzaicini draugus</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
            <p className="text-slate-700 text-sm font-semibold mb-3">Tavs vārds</p>
            <input
              type="text"
              placeholder="Ievadi savu vārdu"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && handleCreateRoom()}
              maxLength={20}
              autoFocus
              className="w-full bg-slate-50 text-slate-900 text-lg font-semibold rounded-2xl px-4 py-4 outline-none border-2 border-slate-200 focus:border-orange-500 transition-colors mb-4"
            />

            {roomError && (
              <p className="text-rose-500 text-sm font-medium mb-4">{roomError}</p>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || creatingRoom}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.98]"
            >
              {creatingRoom ? 'Izveido...' : 'Izveidot istabu'}
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-2 text-slate-400 hover:text-slate-600 font-semibold text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- ISTABA IZVEIDOTA: rāda kodu ---
  if (mode === 'room-created') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Istaba izveidota!</h1>
            <p className="text-slate-500 text-sm">Iedod šo kodu draugiem, lai viņi pievienotos</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-3">Istabas kods</p>
            <p className="text-5xl font-black text-slate-900 tracking-[0.2em] mb-6">{roomCode}</p>

            <button
              onClick={copyRoomCode}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl py-3.5 transition-all mb-3"
            >
              {codeCopied ? (
                <>
                  <Check className="w-4 h-4" /> Nokopēts!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Kopēt kodu
                </>
              )}
            </button>

            <p className="text-slate-400 text-xs">
              Nākamais solis: lobby ar spēlētāju sarakstu un "Sākt spēli" pogu vēl tiks pievienots
            </p>

            <button
              onClick={() => {
                setMode('menu')
                setPlayerName('')
                setRoomCode('')
              }}
              className="w-full mt-4 text-slate-400 hover:text-slate-600 font-semibold text-xs py-2 transition-colors"
            >
              ← Atpakaļ uz izvēlni
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Ielādē spēli...</p>
        </div>
      </div>
    )
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-[fadeIn_0.4s_ease-out]">
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100">
            <p className="text-5xl mb-3">🏁</p>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Spēle beigusies!</h1>
            <p className="text-slate-500 text-sm mb-6">Paldies, ka spēlēji Cikmaksā.lv</p>
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6">
              <p className="text-5xl font-black text-white">{totalScore}</p>
              <p className="text-white/90 text-sm mt-1">no {ROUNDS_COUNT * 100} punktiem</p>
            </div>
            <button
              onClick={() => {
                setMode('menu')
                setGameFinished(false)
                setCurrentIndex(0)
                setTotalScore(0)
                setGuess('')
                setRevealed(false)
              }}
              className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl py-3 transition-all"
            >
              Spēlēt vēlreiz
            </button>
          </div>
        </div>
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  const question = questions[currentIndex]
  const Icon = getCategoryIcon(question.category)
  const progressPct = ((currentIndex + (revealed ? 1 : 0)) / questions.length) * 100
  const photos = question.image_urls && question.image_urls.length > 0
    ? question.image_urls
    : (question.image_url ? [question.image_url] : [])
  const specs = question.specs && typeof question.specs === 'object' ? question.specs : {}
  const rawSpecEntries = Object.entries(specs).filter(([key]) => key !== 'Marka')
  const specEntries = sortSpecs(rawSpecEntries).slice(0, 4)

  const guessNum = Number(guess)
  const diffAmount = revealed ? guessNum - question.correct_price : 0
  const timerPct = selectedTimer > 0 ? (timeLeft / selectedTimer) * 100 : 100
  const timerColor = timeLeft <= 5 ? 'text-rose-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-orange-500'
  const timerBarColor = timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-orange-500'

  function handleGuess() {
    const score = calculateScore(Number(guess), question.correct_price)
    setLastRoundScore(score)
    setTotalScore((prev) => prev + score)
    setRevealed(true)
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setGameFinished(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
      setGuess('')
      setRevealed(false)
    }
  }

  function prevPhoto() {
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  function nextPhoto() {
    setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-slate-500 text-xs font-bold tracking-wide">
            RAUNDS {currentIndex + 1}/{questions.length}
          </span>
          <div className="flex items-center gap-2">
            {!revealed && selectedTimer > 0 && (
              <span className={`flex items-center gap-1 text-xs font-bold ${timerColor}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft}s
              </span>
            )}
            <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
              {totalScore} PTS
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {!revealed && selectedTimer > 0 && (
          <div className="w-full h-1 bg-slate-200 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full ${timerBarColor} rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}
        {(revealed || selectedTimer === 0) && <div className="mb-4" />}

        <div
          className={`bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 transition-all duration-300 flex flex-col md:flex-row ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          {photos.length > 0 && (
            <div className="relative w-full md:w-1/2 h-64 md:h-[500px] bg-slate-100 shrink-0">
              <img
                src={photos[photoIndex]}
                alt=""
                className="w-full h-full object-contain"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === photoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {photoIndex + 1}/{photos.length}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="w-full md:w-1/2 flex flex-col max-h-[500px]">
            <div className="overflow-y-auto flex-1 min-h-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-orange-500" strokeWidth={2.2} />
                </div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wide">
                  {question.category.replace('_', ' ')}
                </span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 mb-1 leading-snug">{question.title}</h1>
              <p className="text-slate-500 text-sm mb-5">{question.details}</p>

              {specEntries.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {specEntries.map(([label, value]) => {
                    const SpecIcon = getSpecIcon(label)
                    return (
                      <div key={label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <SpecIcon className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 text-sm font-bold truncate">{value}</p>
                          <p className="text-slate-400 text-[10px] font-medium truncate">{label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 bg-white shrink-0">
              {!revealed && (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                      €
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && guess && handleGuess()}
                      autoFocus
                      className="w-full bg-slate-50 text-slate-900 text-xl font-bold rounded-2xl pl-10 pr-4 py-4 outline-none border-2 border-slate-200 focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleGuess}
                    disabled={!guess}
                    className="bg-orange-500 hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.98]"
                  >
                    Minēt cenu
                  </button>
                </div>
              )}

              {revealed && (
                <div className="flex flex-col gap-3 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Tavs minējums</p>
                      <p className="text-slate-900 font-bold text-base">{guess || 0} €</p>
                    </div>
                    <div className="flex-1 bg-emerald-50 rounded-xl p-3">
                      <p className="text-emerald-600 text-[9px] font-bold uppercase mb-0.5">Pareizā cena</p>
                      <p className="text-emerald-600 font-bold text-base">{question.correct_price} €</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-500">
                    {diffAmount > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                        <span>par {diffAmount} € pārāk daudz</span>
                      </>
                    ) : diffAmount < 0 ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                        <span>par {Math.abs(diffAmount)} € pārāk maz</span>
                      </>
                    ) : (
                      <span className="text-emerald-600">Precīzi trāpīts! 🎯</span>
                    )}
                  </div>

                  <div className="text-center py-3 bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl">
                    <p className="text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                      +{lastRoundScore}
                    </p>
                    <p className="text-slate-500 text-xs font-semibold">punkti šajā raundā</p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.98]"
                  >
                    Nākamais →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}