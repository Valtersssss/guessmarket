'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from './lib/supabase'
import { Car, Building2, Key, Briefcase, Smartphone, MapPin, Dice5, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronDown, Clock, LayoutGrid, Users, User, Copy, Check, Calendar, Gauge, Fuel, Settings2, Ruler, Layers, Palette, ShieldCheck, DoorOpen, Crown, Loader2, Trophy, Medal, X, Lock, Sparkles, Dog, Cat, Rabbit, Sofa, PawPrint, Gem } from 'lucide-react'

const DEFAULT_ROUNDS = 5
const ROUND_OPTIONS = [
  { key: 5, label: '5' },
  { key: 10, label: '10' },
  { key: 15, label: '15' },
]

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
  suņi: Dog,
  kaķi: Cat,
  eksotiskie_dzīvnieki: Rabbit,
  mēbeles: Sofa,
  dārglietas: Gem,
}

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Visas', icon: LayoutGrid },
  { key: 'auto', label: 'Auto', icon: Car },
  { key: 'dzīvoklis_pārdošana', label: 'Dzīvokļi', icon: Building2 },
  { key: 'zeme', label: 'Zeme', icon: MapPin },
  { key: 'elektronika', label: 'Elektronika', icon: Smartphone },
  { key: 'dzīvnieki', label: 'Dzīvnieki', icon: PawPrint, isExpander: true },
  { key: 'mēbeles', label: 'Mēbeles', icon: Sofa },
  { key: 'dārglietas', label: 'Dārglietas', icon: Gem },
]

const ANIMAL_SUBCATEGORIES = [
  { key: 'suņi', label: 'Suņi', icon: Dog },
  { key: 'kaķi', label: 'Kaķi', icon: Cat },
  { key: 'eksotiskie_dzīvnieki', label: 'Eksotiskie', icon: Rabbit },
  { key: 'dzīvnieki_visi', label: 'Visi kopā', icon: PawPrint, categories: ['suņi', 'kaķi', 'eksotiskie_dzīvnieki'] },
]

const CATEGORY_ACCENT = {
  all: { bg: 'bg-[#EF9F27]', border: 'border-[#EF9F27]', text: 'text-[#412402]' },
  auto: { bg: 'bg-[#185FA5]', border: 'border-[#185FA5]', text: 'text-white' },
  dzīvoklis_pārdošana: { bg: 'bg-[#993556]', border: 'border-[#993556]', text: 'text-white' },
  zeme: { bg: 'bg-[#3B6D11]', border: 'border-[#3B6D11]', text: 'text-white' },
  elektronika: { bg: 'bg-[#0F6E56]', border: 'border-[#0F6E56]', text: 'text-white' },
  dzīvnieki: { bg: 'bg-[#8B5A2B]', border: 'border-[#8B5A2B]', text: 'text-white' },
  dzīvnieki_visi: { bg: 'bg-[#8B5A2B]', border: 'border-[#8B5A2B]', text: 'text-white' },
  suņi: { bg: 'bg-[#8B5A2B]', border: 'border-[#8B5A2B]', text: 'text-white' },
  kaķi: { bg: 'bg-[#7C5CAE]', border: 'border-[#7C5CAE]', text: 'text-white' },
  eksotiskie_dzīvnieki: { bg: 'bg-[#2F8F6B]', border: 'border-[#2F8F6B]', text: 'text-white' },
  mēbeles: { bg: 'bg-[#A0693D]', border: 'border-[#A0693D]', text: 'text-white' },
  dārglietas: { bg: 'bg-[#B8932F]', border: 'border-[#B8932F]', text: 'text-white' },
}

const PAGE_BG_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
    '<text x="10" y="45" font-family="Arial, sans-serif" font-size="34" fill="#171717" opacity="0.045" transform="rotate(-12 10 45)">€</text>' +
    '<text x="110" y="140" font-family="Arial, sans-serif" font-size="24" fill="#171717" opacity="0.045" transform="rotate(14 110 140)">€</text>' +
    '<text x="130" y="35" font-family="Arial, sans-serif" font-size="18" fill="#171717" opacity="0.04" transform="rotate(-8 130 35)">€</text>' +
    '</svg>'
)}")`

function applyCategoryFilter(query, categoryKey) {
  if (categoryKey === 'all') return query
  const filterConfig = [...CATEGORY_FILTERS, ...ANIMAL_SUBCATEGORIES].find((c) => c.key === categoryKey)
  if (filterConfig && filterConfig.categories) {
    return query.in('category', filterConfig.categories)
  }
  return query.eq('category', categoryKey)
}

const LEADERBOARD_CATEGORY_OPTIONS = [
  { key: 'overall', label: 'Vispārējais', icon: LayoutGrid },
  { key: 'auto', label: 'Auto', icon: Car },
  { key: 'dzīvoklis_pārdošana', label: 'Dzīvokļi', icon: Building2 },
  { key: 'zeme', label: 'Zeme', icon: MapPin },
  { key: 'elektronika', label: 'Elektronika', icon: Smartphone },
  { key: 'suņi', label: 'Suņi', icon: Dog },
  { key: 'kaķi', label: 'Kaķi', icon: Cat },
  { key: 'mēbeles', label: 'Mēbeles', icon: Sofa },
  { key: 'dārglietas', label: 'Dārglietas', icon: Gem },
]

function getCategoryLabel(key) {
  const found = CATEGORY_FILTERS.find((c) => c.key === key)
  return found ? found.label : key
}

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
  // 'menu' | 'solo-setup' | 'create-room' | 'join-room' | 'lobby' | 'game'
  const [mode, setMode] = useState('menu')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [animalsExpanded, setAnimalsExpanded] = useState(false)
  const [selectedTimer, setSelectedTimer] = useState(30)
  const [selectedRounds, setSelectedRounds] = useState(DEFAULT_ROUNDS)
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [isPublicRoom, setIsPublicRoom] = useState(false)
  const [publicRooms, setPublicRooms] = useState([])
  const [publicRoomsLoading, setPublicRoomsLoading] = useState(true)
  const [joiningRoom, setJoiningRoom] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [lobbyPlayers, setLobbyPlayers] = useState([])
  const [startingGame, setStartingGame] = useState(false)
  const [roundAnswers, setRoundAnswers] = useState([])
  const [finalLeaderboard, setFinalLeaderboard] = useState(null)

  const [dailyChallenge, setDailyChallenge] = useState(null)
  const [dailyQuestion, setDailyQuestion] = useState(null)
  const [dailyGuess, setDailyGuess] = useState('')
  const [dailyRevealed, setDailyRevealed] = useState(false)
  const [dailyScore, setDailyScore] = useState(0)
  const [dailyPriorAttempt, setDailyPriorAttempt] = useState(null)
  const [dailyLeaderboard, setDailyLeaderboard] = useState([])
  const [dailyLoading, setDailyLoading] = useState(true)
  const [dailyCopied, setDailyCopied] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState(1)

  const [leaderboardRows, setLeaderboardRows] = useState([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardMetric, setLeaderboardMetric] = useState('total_score')
  const [leaderboardCategory, setLeaderboardCategory] = useState('overall')

  const [gameHistory, setGameHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [authUser, setAuthUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [soloError, setSoloError] = useState('')
  const [gameType, setGameType] = useState('normal')
  const [reverseRounds, setReverseRounds] = useState([])
  const [reverseIndex, setReverseIndex] = useState(0)
  const [reverseSelectedId, setReverseSelectedId] = useState(null)
  const [reverseRevealed, setReverseRevealed] = useState(false)
  const [reverseTotalScore, setReverseTotalScore] = useState(0)
  const [reverseFinished, setReverseFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [guess, setGuess] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [lastRoundScore, setLastRoundScore] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)
  const [animateIn, setAnimateIn] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(selectedTimer)
  const guessRef = useRef(guess)
  const revealedRef = useRef(revealed)
  const submittedRef = useRef(submitted)
  const totalScoreRef = useRef(totalScore)
  const currentIndexRef = useRef(currentIndex)
  const questionsLengthRef = useRef(0)
  const roomIdRef = useRef(null)
  const playerIdRef = useRef(null)
  const authUserRef = useRef(null)
  const selectedCategoryRef = useRef(selectedCategory)
  const selectedRoundsRef = useRef(selectedRounds)

  useEffect(() => {
    const presenceChannel = supabase.channel('online-players', {
      config: { presence: { key: Math.random().toString(36).slice(2) } },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        setOnlinePlayers(Object.keys(state).length || 1)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [])

  useEffect(() => {
    guessRef.current = guess
  }, [guess])

  useEffect(() => {
    revealedRef.current = revealed
  }, [revealed])

  useEffect(() => {
    submittedRef.current = submitted
  }, [submitted])

  useEffect(() => {
    totalScoreRef.current = totalScore
  }, [totalScore])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    questionsLengthRef.current = questions.length
  }, [questions])

  useEffect(() => {
    roomIdRef.current = roomId
  }, [roomId])

  useEffect(() => {
    playerIdRef.current = playerId
  }, [playerId])

  useEffect(() => {
    authUserRef.current = authUser
  }, [authUser])

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory
  }, [selectedCategory])

  useEffect(() => {
    selectedRoundsRef.current = selectedRounds
  }, [selectedRounds])

  const isPopRef = useRef(false)

  function resetGameState() {
    setPlayerName('')
    setRoomCode('')
    setRoomId(null)
    setPlayerId(null)
    setIsHost(false)
    setLobbyPlayers([])
    setGameFinished(false)
    setCurrentIndex(0)
    setTotalScore(0)
    setGuess('')
    setRevealed(false)
    setSubmitted(false)
    setFinalLeaderboard(null)
    setQuestions([])
    setAnsweredCount(0)
  }

  useEffect(() => {
    window.history.replaceState({ mode: 'menu' }, '')
  }, [])

  useEffect(() => {
    if (isPopRef.current) {
      isPopRef.current = false
      return
    }
    window.history.pushState({ mode }, '')
  }, [mode])

  async function leaveRoom() {
    const rId = roomIdRef.current
    const pId = playerIdRef.current
    if (rId && pId) {
      try {
        await supabase.from('players').delete().eq('id', pId)
      } catch (e) {
        console.error('Kļūda dzēšot spēlētāju:', e)
      }
    }
    resetGameState()
  }

  useEffect(() => {
    function onPopState(event) {
      const newMode = event.state?.mode || 'menu'
      isPopRef.current = true
      if (newMode === 'menu') {
        leaveRoom()
      }
      setMode(newMode)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  async function startSoloGame() {
    setLoadingQuestions(true)
    setSoloError('')
    let query = supabase.from('questions').select('*')

    query = applyCategoryFilter(query, selectedCategory)

    const { data, error } = await query

    if (error) {
      console.error('Kļūda ielādējot jautājumus:', error)
      setSoloError('Neizdevās ielādēt jautājumus. Mēģini vēlreiz.')
    } else if (!data || data.length === 0) {
      setSoloError('Šai kategorijai vēl nav sludinājumu. Izvēlies citu kategoriju.')
    } else {
      const shuffled = [...data].sort(() => Math.random() - 0.5)
      setQuestions(shuffled.slice(0, selectedRounds))
      setMode('game')
    }
    setLoadingQuestions(false)
  }

  function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  async function startReverseGame() {
    setLoadingQuestions(true)
    setSoloError('')
    let query = supabase.from('questions').select('*')

    query = applyCategoryFilter(query, selectedCategory)

    const { data, error } = await query

    if (error) {
      console.error('Kļūda ielādējot jautājumus:', error)
      setSoloError('Neizdevās ielādēt jautājumus. Mēģini vēlreiz.')
      setLoadingQuestions(false)
      return
    }

    if (!data || data.length < 4) {
      setSoloError('Šai kategorijai nav pietiekami daudz sludinājumu ačgārnajai spēlei.')
      setLoadingQuestions(false)
      return
    }

    const pool = shuffleArray(data)
    const correctItems = pool.slice(0, selectedRounds)

    const rounds = correctItems.map((correct) => {
      const decoyPool = shuffleArray(data.filter((q) => q.id !== correct.id)).slice(0, 3)
      const options = shuffleArray([correct, ...decoyPool])
      return { correct, options }
    })

    setReverseRounds(rounds)
    setReverseIndex(0)
    setReverseSelectedId(null)
    setReverseRevealed(false)
    setReverseTotalScore(0)
    setReverseFinished(false)
    setMode('reverse-game')
    setLoadingQuestions(false)
  }

  function handleReverseGuess(optionId) {
    if (reverseRevealed) return
    const round = reverseRounds[reverseIndex]
    const isCorrect = optionId === round.correct.id
    const score = isCorrect ? 100 : 0
    setReverseSelectedId(optionId)
    setReverseRevealed(true)
    setReverseTotalScore((prev) => prev + score)
  }

  function handleReverseNext() {
    if (reverseIndex + 1 >= reverseRounds.length) {
      setReverseFinished(true)
    } else {
      setReverseIndex((prev) => prev + 1)
      setReverseSelectedId(null)
      setReverseRevealed(false)
    }
  }

  async function handleCreateRoom() {
    if (!playerName.trim()) return
    setCreatingRoom(true)
    setRoomError('')

    const code = generateRoomCode()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        code,
        status: 'lobby',
        max_rounds: selectedRounds,
        category: selectedCategory,
        timer_seconds: selectedTimer,
        is_public: isPublicRoom,
      })
      .select()
      .single()

    if (roomErr) {
      console.error(roomErr)
      setRoomError('Neizdevās izveidot istabu. Mēģini vēlreiz.')
      setCreatingRoom(false)
      return
    }

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: playerName.trim(), is_host: true })
      .select()
      .single()

    if (playerErr) {
      console.error(playerErr)
      setRoomError('Neizdevās pievienoties istabai. Mēģini vēlreiz.')
      setCreatingRoom(false)
      return
    }

    setRoomCode(code)
    setRoomId(room.id)
    setPlayerId(player.id)
    setIsHost(true)
    setMode('lobby')
    setCreatingRoom(false)
  }

  async function handleJoinRoom() {
    if (!playerName.trim() || !joinCodeInput.trim()) return
    setJoiningRoom(true)
    setJoinError('')

    const normalizedCode = joinCodeInput.trim().toUpperCase()

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .single()

    if (roomErr || !room) {
      setJoinError('Istaba ar šo kodu nav atrasta. Pārbaudi kodu.')
      setJoiningRoom(false)
      return
    }

    if (room.status !== 'lobby') {
      setJoinError('Šī spēle jau ir sākusies vai beigusies.')
      setJoiningRoom(false)
      return
    }

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: playerName.trim(), is_host: false })
      .select()
      .single()

    if (playerErr) {
      console.error(playerErr)
      setJoinError('Neizdevās pievienoties istabai. Mēģini vēlreiz.')
      setJoiningRoom(false)
      return
    }

    setRoomCode(normalizedCode)
    setRoomId(room.id)
    setPlayerId(player.id)
    setIsHost(false)
    setMode('lobby')
    setJoiningRoom(false)
  }

  async function loadPublicRooms() {
    setPublicRoomsLoading(true)

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'lobby')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!roomsData || roomsData.length === 0) {
      setPublicRooms([])
      setPublicRoomsLoading(false)
      return
    }

    const roomIds = roomsData.map((r) => r.id)
    const { data: allPlayers } = await supabase
      .from('players')
      .select('room_id, name, is_host')
      .in('room_id', roomIds)

    const enriched = roomsData.map((r) => {
      const roomPlayers = (allPlayers || []).filter((p) => p.room_id === r.id)
      const host = roomPlayers.find((p) => p.is_host)
      return {
        ...r,
        playerCount: roomPlayers.length,
        hostName: host ? host.name : 'Nezināms',
      }
    })

    setPublicRooms(enriched)
    setPublicRoomsLoading(false)
  }

  useEffect(() => {
    if (mode !== 'public-rooms') return

    loadPublicRooms()

    const channel = supabase
      .channel('public-rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadPublicRooms()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        loadPublicRooms()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mode])

  async function handleJoinPublicRoom(room) {
    if (!playerName.trim()) {
      setJoinError('Ievadi savu vārdu.')
      return
    }
    setJoiningRoom(true)
    setJoinError('')

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .insert({ room_id: room.id, name: playerName.trim(), is_host: false })
      .select()
      .single()

    if (playerErr) {
      console.error(playerErr)
      setJoinError('Neizdevās pievienoties istabai. Mēģini vēlreiz.')
      setJoiningRoom(false)
      return
    }

    setRoomCode(room.code)
    setRoomId(room.id)
    setPlayerId(player.id)
    setIsHost(false)
    setMode('lobby')
    setJoiningRoom(false)
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(data)
  }

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted && session?.user) {
        setAuthUser(session.user)
        fetchProfile(session.user.id)
      }
    }
    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setAuthUser(null)
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignUp() {
    setAuthSubmitting(true)
    setAuthError('')

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
    })

    if (error) {
      setAuthError('Neizdevās reģistrēties. ' + error.message)
    } else if (data.session) {
      setAuthUser(data.user)
      await fetchProfile(data.user.id)
      setAuthEmail('')
      setAuthPassword('')
      setMode('menu')
    } else {
      setAuthError('Reģistrācija veiksmīga! Pārbaudi e-pastu, lai apstiprinātu kontu, tad ielogojies.')
    }

    setAuthSubmitting(false)
  }

  async function handleLogin() {
    setAuthSubmitting(true)
    setAuthError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    })

    if (error) {
      setAuthError('Nepareizs e-pasts vai parole.')
    } else {
      setAuthUser(data.user)
      await fetchProfile(data.user.id)
      setAuthEmail('')
      setAuthPassword('')
      setMode('menu')
    }

    setAuthSubmitting(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setAuthUser(null)
    setProfile(null)
    setMode('menu')
  }

  async function updateProfileStats(finalScore) {
    if (!authUser) return

    const newGamesPlayed = (profile?.games_played || 0) + 1
    const newTotalScore = (profile?.total_score || 0) + finalScore
    const newBestScore = Math.max(profile?.best_score || 0, finalScore)

    const { error } = await supabase
      .from('profiles')
      .update({
        games_played: newGamesPlayed,
        total_score: newTotalScore,
        best_score: newBestScore,
      })
      .eq('id', authUser.id)

    if (!error) {
      setProfile((prev) => ({
        ...prev,
        games_played: newGamesPlayed,
        total_score: newTotalScore,
        best_score: newBestScore,
      }))
    }
  }

  async function refreshDailyLeaderboard(challengeId) {
    const { data: attempts } = await supabase
      .from('daily_challenge_attempts')
      .select('score, user_id')
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .limit(5)

    if (!attempts || attempts.length === 0) {
      setDailyLeaderboard([])
      return
    }

    const userIds = attempts.map((a) => a.user_id)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const rows = attempts.map((a) => ({
      score: a.score,
      username: profilesData?.find((p) => p.id === a.user_id)?.username || 'Spēlētājs',
    }))
    setDailyLeaderboard(rows)
  }

  async function loadDailyChallenge() {
    setDailyLoading(true)
    setDailyGuess('')
    setDailyRevealed(false)
    setDailyPriorAttempt(null)

    const todayStr = new Date().toISOString().slice(0, 10)

    let { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', todayStr)
      .maybeSingle()

    if (!challenge) {
      const { data: pool } = await supabase.from('questions').select('id')
      if (pool && pool.length > 0) {
        const randomQuestion = pool[Math.floor(Math.random() * pool.length)]
        await supabase
          .from('daily_challenges')
          .insert({ challenge_date: todayStr, question_id: randomQuestion.id })

        const { data: refetched } = await supabase
          .from('daily_challenges')
          .select('*')
          .eq('challenge_date', todayStr)
          .maybeSingle()
        challenge = refetched
      }
    }

    if (!challenge) {
      setDailyLoading(false)
      return
    }

    setDailyChallenge(challenge)

    const { data: q } = await supabase
      .from('questions')
      .select('*')
      .eq('id', challenge.question_id)
      .single()
    setDailyQuestion(q)

    if (authUser) {
      const { data: existingAttempt } = await supabase
        .from('daily_challenge_attempts')
        .select('*')
        .eq('challenge_id', challenge.id)
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (existingAttempt) {
        setDailyPriorAttempt(existingAttempt)
        setDailyScore(existingAttempt.score)
        setDailyRevealed(true)
      }
    }

    await refreshDailyLeaderboard(challenge.id)
    setDailyLoading(false)
  }

  async function handleDailyGuess() {
    const score = calculateScore(Number(dailyGuess), dailyQuestion.correct_price)
    setDailyScore(score)
    setDailyRevealed(true)

    if (authUser && dailyChallenge) {
      await supabase.from('daily_challenge_attempts').insert({
        challenge_id: dailyChallenge.id,
        user_id: authUser.id,
        guess: Number(dailyGuess),
        score,
      })
      await refreshDailyLeaderboard(dailyChallenge.id)
    }
  }

  function copyDailyResult() {
    const text = `Cikmaksā.lv — šodienas izaicinājums: ${dailyScore}/100 punktiem 🎯 Vai tu vari labāk? cikmaksā.lv`
    navigator.clipboard.writeText(text)
    setDailyCopied(true)
    setTimeout(() => setDailyCopied(false), 2000)
  }

  useEffect(() => {
    loadDailyChallenge()
  }, [])

  async function loadLeaderboard(metric, category) {
    setLeaderboardLoading(true)

    if (category === 'overall') {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, total_score, best_score, games_played')
        .order(metric, { ascending: false })
        .limit(50)

      setLeaderboardRows(
        (data || []).map((r) => ({
          id: r.id,
          username: r.username,
          value: metric === 'total_score' ? r.total_score : r.best_score,
          meta: `${r.games_played} spēles`,
        }))
      )
    } else {
      const { data } = await supabase
        .from('game_sessions')
        .select('user_id, score, played_at')
        .eq('category', category)
        .order('score', { ascending: false })
        .limit(50)

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((d) => d.user_id))]
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds)

        setLeaderboardRows(
          data.map((d) => ({
            id: d.user_id,
            username: profilesData?.find((p) => p.id === d.user_id)?.username || 'Spēlētājs',
            value: d.score,
            meta: new Date(d.played_at).toLocaleDateString('lv-LV'),
          }))
        )
      } else {
        setLeaderboardRows([])
      }
    }

    setLeaderboardLoading(false)
  }

  useEffect(() => {
    if (mode === 'leaderboard') {
      loadLeaderboard(leaderboardMetric, leaderboardCategory)
    }
  }, [mode, leaderboardMetric, leaderboardCategory])

  async function loadGameHistory(userId) {
    setHistoryLoading(true)
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(50)
    setGameHistory(data || [])
    setHistoryLoading(false)
  }

  useEffect(() => {
    if (mode === 'profile' && authUser) {
      loadGameHistory(authUser.id)
    }
  }, [mode, authUser])

  async function handleKickPlayer(id) {
    if (!isHost) return
    await supabase.from('players').delete().eq('id', id)
  }

  // --- LOBBY + SPĒLES LAIKĀ: spēlētāju saraksts reāllaikā, spēles sākuma sinhronizācija ---
  useEffect(() => {
    if ((mode !== 'lobby' && mode !== 'game') || !roomId) return

    async function fetchPlayers() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      if (data) setLobbyPlayers(data)
    }

    fetchPlayers()

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => {
          fetchPlayers()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        async (payload) => {
          const updatedRoom = payload.new

          if (updatedRoom.status === 'playing' && updatedRoom.question_ids && mode === 'lobby') {
            const { data: qData } = await supabase
              .from('questions')
              .select('*')
              .in('id', updatedRoom.question_ids)

            if (qData) {
              const ordered = updatedRoom.question_ids
                .map((id) => qData.find((q) => q.id === id))
                .filter(Boolean)
              setQuestions(ordered)
              setSelectedTimer(updatedRoom.timer_seconds ?? 30)
              setMode('game')
            }
            return
          }

          if (mode === 'game' && typeof updatedRoom.current_question_index === 'number') {
            const newIndex = updatedRoom.current_question_index
            if (newIndex !== currentIndexRef.current) {
              if (newIndex >= questionsLengthRef.current) {
                const { data } = await supabase
                  .from('players')
                  .select('*')
                  .eq('room_id', roomId)
                  .order('score', { ascending: false })
                setFinalLeaderboard(data || [])
                setGameFinished(true)

                if (authUserRef.current) {
                  updateProfileStats(totalScoreRef.current)
                  supabase.from('game_sessions').insert({
                    user_id: authUserRef.current.id,
                    category: selectedCategoryRef.current,
                    rounds: selectedRoundsRef.current,
                    score: totalScoreRef.current,
                  })
                }
              } else {
                setCurrentIndex(newIndex)
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mode, roomId])

  // --- Kuri spēlētāji jau atbildējuši šajā raundā, un ar ko (reāllaikā) ---
  useEffect(() => {
    if (mode !== 'game' || !roomId) return

    setRoundAnswers([])

    async function fetchRoundAnswers() {
      const { data } = await supabase
        .from('answers')
        .select('player_id, guess')
        .eq('room_id', roomId)
        .eq('round_index', currentIndex)
      if (data) setRoundAnswers(data)
    }

    fetchRoundAnswers()

    const channel = supabase
      .channel(`answers-${roomId}-${currentIndex}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `room_id=eq.${roomId}` },
        () => {
          fetchRoundAnswers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mode, roomId, currentIndex])

  async function handleStartGame() {
    setStartingGame(true)

    let query = supabase.from('questions').select('id')
    query = applyCategoryFilter(query, selectedCategory)
    const { data, error } = await query

    if (error || !data || data.length === 0) {
      console.error(error)
      setStartingGame(false)
      return
    }

    const shuffled = [...data].sort(() => Math.random() - 0.5)
    const ids = shuffled.slice(0, selectedRounds).map((q) => q.id)

    await supabase
      .from('rooms')
      .update({ status: 'playing', question_ids: ids })
      .eq('id', roomId)

    // Pārējais notiek automātiski caur realtime abonementu augšā
  }

  useEffect(() => {
    setAnimateIn(false)
    setPhotoIndex(0)
    setTimeLeft(selectedTimer)
    setGuess('')
    setRevealed(false)
    setSubmitted(false)
    const t = setTimeout(() => setAnimateIn(true), 20)
    return () => clearTimeout(t)
  }, [currentIndex, selectedTimer])

  // --- Kad visi spēlētāji atbildējuši, atklāj rezultātu visiem vienlaicīgi (multiplayer) ---
  useEffect(() => {
    if (!roomId || mode !== 'game') return
    if (submitted && !revealed && lobbyPlayers.length > 0 && roundAnswers.length >= lobbyPlayers.length) {
      setRevealed(true)
    }
  }, [submitted, roundAnswers, lobbyPlayers, roomId, mode, revealed])

  // Ieraksta atbildi datubāzē un atjaunina spēlētāja punktus (tikai multiplayer)
  async function recordMultiplayerAnswer(question, guessValue, score) {
    if (!roomId || !playerId) return

    await supabase.from('answers').insert({
      room_id: roomId,
      player_id: playerId,
      question_id: question.id,
      round_index: currentIndex,
      guess: guessValue,
    })

    const newTotal = totalScoreRef.current + score
    await supabase.from('players').update({ score: newTotal }).eq('id', playerId)
  }

  useEffect(() => {
    if (mode !== 'game' || questions.length === 0 || gameFinished) return
    if (selectedTimer === 0) return

    const interval = setInterval(() => {
      if (revealedRef.current || submittedRef.current) return

      setTimeLeft((prev) => {
        if (prev <= 1) {
          const finalGuess = guessRef.current || '0'
          const question = questions[currentIndex]
          const score = calculateScore(Number(finalGuess), question.correct_price)
          setGuess(finalGuess)
          setLastRoundScore(score)
          setTotalScore((s) => s + score)
          if (roomId) {
            setSubmitted(true)
            recordMultiplayerAnswer(question, Number(finalGuess), score)
          } else {
            setRevealed(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentIndex, questions, gameFinished, mode, selectedTimer, roomId])

  // --- GALVENĀ IZVĒLNE ---
  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="flex items-baseline justify-between mb-8 px-1">
            <div className="text-3xl font-black tracking-tight text-[#171717]">
              Cikmaksā<span className="text-[#EF9F27]">.lv</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#5f5e5a] text-xs font-medium text-right">
              <span className="w-1.5 h-1.5 rounded-full bg-[#639922] inline-block" />
              {onlinePlayers} spēlē tagad
            </div>
          </div>

          {dailyQuestion && (() => {
            const menuDailyPhotos = dailyQuestion.image_urls && dailyQuestion.image_urls.length > 0
              ? dailyQuestion.image_urls
              : (dailyQuestion.image_url ? [dailyQuestion.image_url] : [])
            const MenuDailyIcon = getCategoryIcon(dailyQuestion.category)

            return (
              <div className="relative mb-8">
                <div className="bg-white rounded-3xl border border-[#171717]/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">
                  <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#854F0B]" />
                    <span className="text-[#854F0B] text-xs font-semibold uppercase tracking-wide">Dienas izaicinājums</span>
                  </div>
                  {menuDailyPhotos.length > 0 && (
                    <div className="w-full h-40 bg-[#F5EFE0]">
                      <img src={menuDailyPhotos[0]} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="p-5 pt-6">
                    <p className="text-[#171717] font-semibold text-base mb-0.5">{dailyQuestion.title}</p>
                    <p className="text-[#888780] text-xs mb-3">{dailyQuestion.details}</p>

                    {!dailyRevealed ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="€"
                          value={dailyGuess}
                          onChange={(e) => setDailyGuess(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && dailyGuess && handleDailyGuess()}
                          className="w-24 bg-[#F5EFE0] text-[#171717] text-lg font-bold rounded-xl px-3 py-2.5 outline-none border border-[#171717]/10 focus:border-[#EF9F27] transition-colors"
                        />
                        <button
                          onClick={handleDailyGuess}
                          disabled={!dailyGuess}
                          className="flex-1 bg-[#171717] hover:bg-[#2c2c2a] disabled:opacity-30 text-white font-medium text-sm rounded-xl px-3 py-2.5 transition-all active:scale-[0.98]"
                        >
                          Minēt cenu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center bg-[#639922] text-[#EAF3DE] text-xs font-semibold px-3 py-1.5 rounded-full">
                          {dailyScore}/100
                        </span>
                        <span className="text-[#5f5e5a] text-xs">pareizā cena {dailyQuestion.correct_price} €</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-3 left-5 bg-[#EF9F27] rounded-lg px-3 py-1.5 -rotate-3 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                  <MenuDailyIcon className="w-3.5 h-3.5 text-[#412402]" strokeWidth={2.4} />
                  <span className="text-[#412402] text-[10px] font-bold uppercase tracking-wide">
                    {dailyQuestion.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )
          })()}

          <div className="bg-white rounded-3xl border border-[#171717]/10 divide-y divide-[#171717]/[0.06] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => setMode('solo-setup')}
              className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E6F1FB] flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
                <User className="w-[18px] h-[18px] text-[#185FA5]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#171717] font-medium text-[15px]">Spēlēt solo</p>
                <p className="text-[#888780] text-[13px]">Trenējies viens pats</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#888780] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              onClick={() => setMode('create-room')}
              className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FBEAF0] flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
                <Users className="w-[18px] h-[18px] text-[#993556]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#171717] font-medium text-[15px]">Izveidot istabu</p>
                <p className="text-[#888780] text-[13px]">Spēlē ar draugiem</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#888780] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              onClick={() => setMode('join-room')}
              className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E1F5EE] flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
                <DoorOpen className="w-[18px] h-[18px] text-[#0F6E56]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#171717] font-medium text-[15px]">Pievienoties istabai</p>
                <p className="text-[#888780] text-[13px]">Ievadi drauga istabas kodu</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#888780] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>

            <button
              onClick={() => setMode('daily')}
              className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F5EFE0] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#FAEEDA] flex items-center justify-center shrink-0 group-hover:-rotate-6 transition-transform">
                <Sparkles className="w-[18px] h-[18px] text-[#854F0B]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#171717] font-medium text-[15px]">Dienas izaicinājums</p>
                <p className="text-[#888780] text-[13px]">Viens sludinājums, visiem tas pats</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#888780] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>

          <p className="text-center text-[#888780] text-xs mt-8">
            Balstīts uz reāliem SS.LV sludinājumiem
          </p>
        </div>
      </div>
    )
  }

  // --- SOLO: kategorijas, laika un raundu izvēle ---
  if (mode === 'solo-setup') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[#171717] mb-1.5">Spēlēt solo</h1>
            <p className="text-[#5f5e5a] text-sm">Izvēlies iestatījumus un sāc minēt</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Spēles veids</p>
            <div className="flex gap-2 mb-7">
              <button
                onClick={() => setGameType('normal')}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  gameType === 'normal'
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Parastā spēle
              </button>
              <button
                onClick={() => setGameType('reverse')}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  gameType === 'reverse'
                    ? 'bg-[#EF9F27] border-[#EF9F27] text-[#412402]'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Ačgārnā spēle
              </button>
            </div>
            {gameType === 'reverse' && (
              <p className="text-[#854F0B] text-xs bg-[#FAEEDA] rounded-xl px-3 py-2 mb-7 -mt-4">
                Redzi cenu — uzmini, kurš no 4 sludinājumiem tas ir!
              </p>
            )}

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Kategorija</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {!animalsExpanded ? (
                CATEGORY_FILTERS.map((cat) => {
                  const CatIcon = cat.icon
                  const isAnimalParent = cat.key === 'dzīvnieki'
                  const isSelected = isAnimalParent
                    ? ANIMAL_SUBCATEGORIES.some((sub) => sub.key === selectedCategory)
                    : selectedCategory === cat.key
                  const accent = CATEGORY_ACCENT[cat.key]
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        if (isAnimalParent) {
                          setAnimalsExpanded(true)
                        } else {
                          setSelectedCategory(cat.key)
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                        isSelected
                          ? `${accent.bg} ${accent.border} ${accent.text}`
                          : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                      }`}
                    >
                      <CatIcon className="w-4 h-4" strokeWidth={2.4} />
                      {cat.label}
                      {isAnimalParent && <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )
                })
              ) : (
                <>
                  <button
                    onClick={() => setAnimalsExpanded(false)}
                    className="flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 border-[#171717]/10 bg-white text-[#5f5e5a] text-sm font-bold transition-all hover:border-[#171717]/20"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
                    Atpakaļ
                  </button>
                  {ANIMAL_SUBCATEGORIES.map((sub) => {
                    const SubIcon = sub.icon
                    const isSelected = selectedCategory === sub.key
                    const accent = CATEGORY_ACCENT[sub.key]
                    return (
                      <button
                        key={sub.key}
                        onClick={() => {
                          setSelectedCategory(sub.key)
                          setAnimalsExpanded(false)
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                          isSelected
                            ? `${accent.bg} ${accent.border} ${accent.text}`
                            : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                        }`}
                      >
                        <SubIcon className="w-4 h-4" strokeWidth={2.4} />
                        {sub.label}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Raundu skaits</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {ROUND_OPTIONS.map((opt) => {
                const isSelected = selectedRounds === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedRounds(opt.key)}
                    className={`rounded-full px-5 py-2.5 border-2 text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#171717] border-[#171717] text-white'
                        : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            {gameType === 'normal' && (
              <>
                <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Laiks vienam raundam</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {TIMER_OPTIONS.map((opt) => {
                    const isSelected = selectedTimer === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setSelectedTimer(opt.key)}
                        className={`rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                          isSelected
                            ? 'bg-[#171717] border-[#171717] text-white'
                            : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {soloError && (
              <p className="text-[#A32D2D] text-sm font-medium mb-4 text-center">{soloError}</p>
            )}

            <button
              onClick={() => (gameType === 'reverse' ? startReverseGame() : startSoloGame())}
              disabled={loadingQuestions}
              className="w-full bg-[#EF9F27] hover:bg-[#D98A1F] disabled:opacity-50 text-[#412402] font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
            >
              {loadingQuestions ? 'Ielādē...' : 'Sākt spēli →'}
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-2 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- ISTABAS IZVEIDE: vārds + kategorija + laiks + raundi ---
  if (mode === 'create-room') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[#171717] mb-1.5">Izveidot istabu</h1>
            <p className="text-[#5f5e5a] text-sm">Uzaicini draugus vai atver visiem</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Tavs vārds</p>
            <input
              type="text"
              placeholder="Ievadi savu vārdu"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-bold rounded-2xl px-4 py-3.5 outline-none border-2 border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-7"
            />

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Kategorija</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {!animalsExpanded ? (
                CATEGORY_FILTERS.map((cat) => {
                  const CatIcon = cat.icon
                  const isAnimalParent = cat.key === 'dzīvnieki'
                  const isSelected = isAnimalParent
                    ? ANIMAL_SUBCATEGORIES.some((sub) => sub.key === selectedCategory)
                    : selectedCategory === cat.key
                  const accent = CATEGORY_ACCENT[cat.key]
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        if (isAnimalParent) {
                          setAnimalsExpanded(true)
                        } else {
                          setSelectedCategory(cat.key)
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                        isSelected
                          ? `${accent.bg} ${accent.border} ${accent.text}`
                          : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                      }`}
                    >
                      <CatIcon className="w-4 h-4" strokeWidth={2.4} />
                      {cat.label}
                      {isAnimalParent && <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )
                })
              ) : (
                <>
                  <button
                    onClick={() => setAnimalsExpanded(false)}
                    className="flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 border-[#171717]/10 bg-white text-[#5f5e5a] text-sm font-bold transition-all hover:border-[#171717]/20"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
                    Atpakaļ
                  </button>
                  {ANIMAL_SUBCATEGORIES.map((sub) => {
                    const SubIcon = sub.icon
                    const isSelected = selectedCategory === sub.key
                    const accent = CATEGORY_ACCENT[sub.key]
                    return (
                      <button
                        key={sub.key}
                        onClick={() => {
                          setSelectedCategory(sub.key)
                          setAnimalsExpanded(false)
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                          isSelected
                            ? `${accent.bg} ${accent.border} ${accent.text}`
                            : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                        }`}
                      >
                        <SubIcon className="w-4 h-4" strokeWidth={2.4} />
                        {sub.label}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Raundu skaits</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {ROUND_OPTIONS.map((opt) => {
                const isSelected = selectedRounds === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedRounds(opt.key)}
                    className={`rounded-full px-5 py-2.5 border-2 text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#171717] border-[#171717] text-white'
                        : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Laiks vienam raundam</p>
            <div className="flex flex-wrap gap-2 mb-7">
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = selectedTimer === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedTimer(opt.key)}
                    className={`rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#171717] border-[#171717] text-white'
                        : 'bg-white border-[#171717]/10 text-[#5f5e5a] hover:border-[#171717]/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Redzamība</p>
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setIsPublicRoom(false)}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  !isPublicRoom
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Privāta (ar kodu)
              </button>
              <button
                onClick={() => setIsPublicRoom(true)}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  isPublicRoom
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Publiska
              </button>
            </div>

            {roomError && (
              <p className="text-[#A32D2D] text-sm font-medium mb-4">{roomError}</p>
            )}

            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || creatingRoom}
              className="w-full bg-[#EF9F27] hover:bg-[#D98A1F] disabled:opacity-50 text-[#412402] font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
            >
              {creatingRoom ? 'Izveido...' : 'Izveidot istabu →'}
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-2 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- PIEVIENOŠANĀS ISTABAI: vārds + kods ---
  if (mode === 'join-room') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[#171717] mb-1.5">Pievienoties istabai</h1>
            <p className="text-[#5f5e5a] text-sm">Ievadi drauga istabas kodu</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Tavs vārds</p>
            <input
              type="text"
              placeholder="Ievadi savu vārdu"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-bold rounded-2xl px-4 py-3.5 outline-none border-2 border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-6"
            />

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Istabas kods</p>
            <input
              type="text"
              placeholder="A7K9P"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && joinCodeInput.trim() && handleJoinRoom()}
              maxLength={5}
              className="w-full bg-[#F5EFE0] text-[#171717] text-3xl font-black tracking-[0.3em] text-center rounded-2xl px-4 py-5 outline-none border-2 border-dashed border-[#171717]/20 focus:border-[#EF9F27] transition-colors mb-6 uppercase"
            />

            {joinError && (
              <p className="text-[#A32D2D] text-sm font-medium mb-4">{joinError}</p>
            )}

            <button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !joinCodeInput.trim() || joiningRoom}
              className="w-full bg-[#EF9F27] hover:bg-[#D98A1F] disabled:opacity-50 text-[#412402] font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
            >
              {joiningRoom ? 'Pievienojos...' : 'Pievienoties →'}
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-2 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- IELOGOŠANĀS ---
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717] mb-1.5">Ielogoties</h1>
            <p className="text-[#5f5e5a] text-sm">Piekļūsti savai statistikai un ranžēšanai</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">E-pasts</p>
            <input
              type="email"
              placeholder="tavs@epasts.lv"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              autoFocus
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-medium rounded-2xl px-4 py-3.5 outline-none border border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-4"
            />

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">Parole</p>
            <input
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && authEmail.trim() && authPassword && handleLogin()}
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-medium rounded-2xl px-4 py-3.5 outline-none border border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-4"
            />

            {authError && (
              <p className="text-[#A32D2D] text-sm font-medium mb-4">{authError}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={!authEmail.trim() || !authPassword || authSubmitting}
              className="w-full bg-[#EF9F27] hover:bg-[#D98A1F] disabled:opacity-50 text-[#171717] font-medium text-[15px] rounded-2xl py-4 transition-all active:scale-[0.98]"
            >
              {authSubmitting ? 'Ielogojos...' : 'Ielogoties'}
            </button>

            <button
              onClick={() => {
                setMode('signup')
                setAuthError('')
              }}
              className="w-full mt-3 text-[#5f5e5a] hover:text-[#171717] font-medium text-sm py-2 transition-colors"
            >
              Nav konta? Reģistrējies
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-1 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- REĢISTRĀCIJA ---
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#171717] mb-1.5">Reģistrēties</h1>
            <p className="text-[#5f5e5a] text-sm">Izveido kontu, lai sekotu savai statistikai</p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">E-pasts</p>
            <input
              type="email"
              placeholder="tavs@epasts.lv"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              autoFocus
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-medium rounded-2xl px-4 py-3.5 outline-none border border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-4"
            />

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">Parole</p>
            <input
              type="password"
              placeholder="Vismaz 6 rakstzīmes"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && authEmail.trim() && authPassword.length >= 6 && handleSignUp()}
              className="w-full bg-[#F5EFE0] text-[#171717] text-base font-medium rounded-2xl px-4 py-3.5 outline-none border border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-4"
            />

            {authError && (
              <p className="text-[#A32D2D] text-sm font-medium mb-4">{authError}</p>
            )}

            <button
              onClick={handleSignUp}
              disabled={!authEmail.trim() || authPassword.length < 6 || authSubmitting}
              className="w-full bg-[#EF9F27] hover:bg-[#D98A1F] disabled:opacity-50 text-[#171717] font-medium text-[15px] rounded-2xl py-4 transition-all active:scale-[0.98]"
            >
              {authSubmitting ? 'Reģistrējos...' : 'Reģistrēties'}
            </button>

            <button
              onClick={() => {
                setMode('login')
                setAuthError('')
              }}
              className="w-full mt-3 text-[#5f5e5a] hover:text-[#171717] font-medium text-sm py-2 transition-colors"
            >
              Jau ir konts? Ielogojies
            </button>

            <button
              onClick={() => setMode('menu')}
              className="w-full mt-1 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- PROFILS ---
  if (mode === 'profile') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EF9F27] mb-4 -rotate-3">
              <span className="text-[#412402] font-black text-xl">
                {(profile?.username || authUser?.email || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#171717] mb-1">
              {profile?.username || authUser?.email}
            </h1>
            <p className="text-[#5f5e5a] text-sm">{authUser?.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-white rounded-2xl border border-[#171717]/10 p-4 text-center">
              <p className="text-3xl font-black text-[#171717]">{profile?.games_played ?? 0}</p>
              <p className="text-[#888780] text-[10px] font-semibold uppercase mt-1">Spēles</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#171717]/10 p-4 text-center">
              <p className="text-3xl font-black text-[#171717]">{profile?.total_score ?? 0}</p>
              <p className="text-[#888780] text-[10px] font-semibold uppercase mt-1">Kopā</p>
            </div>
            <div className="bg-[#EF9F27] rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-[#412402]">{profile?.best_score ?? 0}</p>
              <p className="text-[#412402]/70 text-[10px] font-semibold uppercase mt-1">Labākais</p>
            </div>
          </div>

          {!historyLoading && gameHistory.length > 0 && (() => {
            const categoryBests = {}
            gameHistory.forEach((g) => {
              if (!categoryBests[g.category] || g.score > categoryBests[g.category]) {
                categoryBests[g.category] = g.score
              }
            })
            const bestEntries = Object.entries(categoryBests)

            return (
              <>
                {bestEntries.length > 0 && (
                  <>
                    <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">
                      Labākie rezultāti pa kategorijām
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {bestEntries.map(([cat, score]) => {
                        const accent = CATEGORY_ACCENT[cat] || CATEGORY_ACCENT.all
                        return (
                          <div key={cat} className="bg-white border border-[#171717]/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${accent.bg} shrink-0`} />
                            <div className="min-w-0">
                              <p className="text-[#888780] text-[9px] font-semibold uppercase mb-0.5 truncate">
                                {getCategoryLabel(cat)}
                              </p>
                              <p className="text-[#171717] font-black text-base">{score}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">Pēdējās spēles</p>
                <div className="bg-white rounded-3xl border border-[#171717]/10 divide-y divide-[#171717]/[0.06] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.3)] mb-6">
                  {gameHistory.slice(0, 10).map((g) => (
                    <div key={g.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[#171717] font-bold text-sm truncate">{getCategoryLabel(g.category)}</p>
                        <p className="text-[#888780] text-[11px]">
                          {new Date(g.played_at).toLocaleDateString('lv-LV')} · {g.rounds} raundi
                        </p>
                      </div>
                      <span className="text-[#171717] font-black text-sm">{g.score}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}

          <button
            onClick={handleLogout}
            className="w-full bg-[#F1EFE8] hover:bg-[#EDE6D3] text-[#171717] font-bold text-sm rounded-2xl py-3 transition-all mb-2"
          >
            Izlogoties
          </button>
          <button
            onClick={() => setMode('menu')}
            className="w-full text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
          >
            ← Atpakaļ
          </button>
        </div>
      </div>
    )
  }

  // --- DIENAS IZAICINĀJUMS ---
  if (mode === 'daily') {
    if (dailyLoading) {
      return (
        <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#5f5e5a] text-sm">Ielādē dienas izaicinājumu...</p>
          </div>
        </div>
      )
    }

    if (!dailyQuestion) {
      return (
        <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-6" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
          <div className="text-center">
            <p className="text-[#5f5e5a] text-sm mb-4">Neizdevās ielādēt dienas izaicinājumu.</p>
            <button
              onClick={() => setMode('menu')}
              className="text-[#171717] font-medium text-sm underline"
            >
              ← Atpakaļ
            </button>
          </div>
        </div>
      )
    }

    const dq = dailyQuestion
    const DqIcon = getCategoryIcon(dq.category)
    const dqPhotos = dq.image_urls && dq.image_urls.length > 0 ? dq.image_urls : (dq.image_url ? [dq.image_url] : [])
    const dqDiff = dailyRevealed ? Number(dailyGuess || 0) - dq.correct_price : 0

    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 text-[#854F0B] text-xs font-bold uppercase tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Dienas izaicinājums
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#171717]">
              {new Date().toLocaleDateString('lv-LV', { day: 'numeric', month: 'long' })}
            </h1>
          </div>

          {dqPhotos.length > 0 && (
            <div className="relative mb-2">
              <div className="w-full h-52 bg-[#171717] rounded-3xl overflow-hidden">
                <img src={dqPhotos[0]} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 left-5 bg-[#EF9F27] rounded-lg px-3.5 py-2 -rotate-3 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <DqIcon className="w-4 h-4 text-[#412402]" strokeWidth={2.4} />
                <span className="text-[#412402] text-[11px] font-bold uppercase tracking-wide">
                  {dq.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl overflow-hidden border border-[#171717]/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] mb-4 pt-7 px-6 pb-6">
            <h2 className="text-xl font-black tracking-tight text-[#171717] mb-1 leading-snug">{dq.title}</h2>
            <p className="text-[#5f5e5a] text-sm mb-5">{dq.details}</p>

            {!dailyRevealed && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#888780] font-black text-2xl">€</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={dailyGuess}
                    onChange={(e) => setDailyGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && dailyGuess && handleDailyGuess()}
                    autoFocus
                    className="w-full bg-[#F5EFE0] text-[#171717] text-4xl font-black rounded-2xl pl-14 pr-5 py-5 outline-none border-2 border-[#171717]/10 focus:border-[#EF9F27] transition-colors"
                  />
                </div>
                <button
                  onClick={handleDailyGuess}
                  disabled={!dailyGuess}
                  className="bg-[#171717] hover:bg-[#2c2c2a] disabled:opacity-30 text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
                >
                  Minēt cenu
                </button>
              </div>
            )}

            {dailyRevealed && (() => {
              const dailyStamp = dailyScore >= 90
                ? { label: 'Trāpīji!', bg: 'bg-[#639922]', text: 'text-[#EAF3DE]' }
                : dailyScore >= 60
                ? { label: 'Tuvu!', bg: 'bg-[#EF9F27]', text: 'text-[#412402]' }
                : { label: 'Garām', bg: 'bg-[#D85A30]', text: 'text-[#FAECE7]' }
              return (
                <div className="flex flex-col gap-3">
                  <div className="text-center py-2">
                    <div className={`inline-block ${dailyStamp.bg} ${dailyStamp.text} text-sm font-bold px-4 py-1.5 rounded-full -rotate-2 mb-4`}>
                      {dailyStamp.label}
                    </div>
                    <p className="text-5xl font-black text-[#171717] mb-1">{dq.correct_price} €</p>
                    <p className="text-[#888780] text-xs font-medium mb-3">bija pareizā cena</p>
                    <p className="text-[#5f5e5a] text-sm">
                      Tavs minējums: <span className="font-bold text-[#171717]">{dailyPriorAttempt?.guess ?? dailyGuess} €</span>
                    </p>
                  </div>

                  <div className="text-center py-5 bg-[#EF9F27] rounded-2xl">
                    <p className="text-5xl font-black text-[#171717]">{dailyScore}</p>
                    <p className="text-[#412402]/70 text-xs font-bold uppercase tracking-wide mt-1">no 100 punktiem</p>
                  </div>

                  {authUser && (
                    <button
                      onClick={copyDailyResult}
                      className="flex items-center justify-center gap-2 bg-[#F1EFE8] hover:bg-[#EDE6D3] text-[#171717] font-bold text-sm rounded-2xl py-3 transition-all"
                    >
                      {dailyCopied ? (
                        <>
                          <Check className="w-4 h-4" /> Nokopēts!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> Kopēt rezultātu
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>

          {dailyLeaderboard.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#171717]/10 divide-y divide-[#171717]/[0.06] overflow-hidden mb-4">
              <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide px-4 py-3">Šodienas labākie</p>
              {dailyLeaderboard.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#F1EFE8] flex items-center justify-center shrink-0 text-[#5f5e5a] font-bold text-[10px]">
                    {i === 0 ? <Trophy className="w-3 h-3 text-[#854F0B]" /> : i + 1}
                  </div>
                  <span className="text-[#171717] font-bold text-sm flex-1 truncate">{r.username}</span>
                  <span className="text-[#171717] font-black text-sm">{r.score}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setMode('menu')}
            className="w-full text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
          >
            ← Atpakaļ
          </button>
        </div>
      </div>
    )
  }

  // --- RANGU TABULA ---
  if (mode === 'leaderboard') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tight text-[#171717] mb-1">Rangu tabula</h1>
            <p className="text-[#5f5e5a] text-sm">Visu reģistrēto spēlētāju rezultāti</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {LEADERBOARD_CATEGORY_OPTIONS.map((cat) => {
              const CatIcon = cat.icon
              const isSelected = leaderboardCategory === cat.key
              const accent = CATEGORY_ACCENT[cat.key] || CATEGORY_ACCENT.all
              return (
                <button
                  key={cat.key}
                  onClick={() => setLeaderboardCategory(cat.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 border-2 text-xs font-bold transition-all ${
                    isSelected
                      ? `${accent.bg} ${accent.border} ${accent.text}`
                      : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {leaderboardCategory === 'overall' && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLeaderboardMetric('total_score')}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  leaderboardMetric === 'total_score'
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Kopā
              </button>
              <button
                onClick={() => setLeaderboardMetric('best_score')}
                className={`flex-1 rounded-full px-4 py-2.5 border-2 text-sm font-bold transition-all ${
                  leaderboardMetric === 'best_score'
                    ? 'bg-[#171717] border-[#171717] text-white'
                    : 'bg-white border-[#171717]/10 text-[#5f5e5a]'
                }`}
              >
                Labākais
              </button>
            </div>
          )}

          {leaderboardLoading ? (
            <div className="flex items-center justify-center gap-2 text-[#888780] text-sm py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ielādē...
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-6">
              {leaderboardRows.map((row, i) => {
                const isMe = authUser && row.id === authUser.id
                const isTop = i === 0
                return (
                  <div
                    key={`${row.id}-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${
                      isTop
                        ? 'bg-[#EF9F27] border-[#EF9F27]'
                        : isMe
                        ? 'bg-white border-[#171717]'
                        : 'bg-white border-[#171717]/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                      isTop ? 'bg-white text-[#412402]' : 'bg-[#F1EFE8] text-[#5f5e5a]'
                    }`}>
                      {isTop ? <Trophy className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${isTop ? 'text-[#412402]' : 'text-[#171717]'}`}>
                        {row.username || 'Spēlētājs'}{isMe ? ' (tu)' : ''}
                      </p>
                      <p className={`text-[11px] ${isTop ? 'text-[#412402]/70' : 'text-[#888780]'}`}>{row.meta}</p>
                    </div>
                    <span className={`font-black text-lg ${isTop ? 'text-[#412402]' : 'text-[#171717]'}`}>{row.value}</span>
                  </div>
                )
              })}
              {leaderboardRows.length === 0 && (
                <div className="text-center text-[#888780] text-sm py-8">Vēl nav neviena rezultāta.</div>
              )}
            </div>
          )}

          <button
            onClick={() => setMode('menu')}
            className="w-full text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
          >
            ← Atpakaļ
          </button>
        </div>
      </div>
    )
  }

  // --- PUBLISKĀS ISTABAS: pievienošanās bez koda ---
  if (mode === 'public-rooms') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tight text-[#171717] mb-1">Publiskās istabas</h1>
            <p className="text-[#5f5e5a] text-sm">Pievienojies jebkurai atvērtai istabai</p>
          </div>

          <input
            type="text"
            placeholder="Ievadi savu vārdu"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            className="w-full bg-white text-[#171717] text-base font-bold rounded-2xl px-4 py-3.5 outline-none border-2 border-[#171717]/10 focus:border-[#EF9F27] transition-colors mb-4"
          />

          {joinError && (
            <p className="text-[#A32D2D] text-sm font-medium mb-4">{joinError}</p>
          )}

          {publicRoomsLoading ? (
            <div className="flex items-center justify-center gap-2 text-[#888780] text-sm py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ielādē...
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {publicRooms.map((room) => {
                const RoomIcon = getCategoryIcon(room.category)
                const accent = CATEGORY_ACCENT[room.category] || CATEGORY_ACCENT.all
                return (
                  <div
                    key={room.id}
                    className="flex items-center gap-3 bg-white border-2 border-[#171717]/10 rounded-2xl px-4 py-3"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${accent.bg} flex items-center justify-center shrink-0 -rotate-3`}>
                      <RoomIcon className={`w-4 h-4 ${accent.text}`} strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#171717] font-bold text-sm truncate">
                        {room.category === 'all' ? 'Visas kategorijas' : getCategoryLabel(room.category)}
                      </p>
                      <p className="text-[#888780] text-[11px]">
                        {room.max_rounds} raundi · {room.playerCount} spēlētāji · {room.hostName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinPublicRoom(room)}
                      disabled={joiningRoom}
                      className="bg-[#171717] hover:bg-[#2c2c2a] disabled:opacity-50 text-white font-bold text-xs rounded-full px-4 py-2 transition-all active:scale-[0.96] shrink-0"
                    >
                      Pievienoties
                    </button>
                  </div>
                )
              })}
              {publicRooms.length === 0 && (
                <div className="text-center text-[#888780] text-sm py-10">
                  Šobrīd nav neviena atvērta publiska istaba.
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMode('menu')}
            className="w-full text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
          >
            ← Atpakaļ
          </button>
        </div>
      </div>
    )
  }

  // --- AČGĀRNĀ SPĒLE: cena rādīta, uzmini sludinājumu ---
  if (mode === 'reverse-game') {
    if (reverseFinished) {
      const maxReverseScore = reverseRounds.length * 100
      return (
        <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-6" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
          <div className="w-full max-w-sm md:max-w-lg">
            <div className="bg-white rounded-3xl border border-[#171717]/10 p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <div className="inline-block bg-[#EF9F27] rounded-full p-4 -rotate-3 mb-4">
                <Trophy className="w-8 h-8 text-[#412402]" strokeWidth={2.4} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#171717] mb-1">Ačgārnā spēle beigusies!</h1>
              <p className="text-[#5f5e5a] text-sm mb-6">
                {reverseTotalScore === maxReverseScore ? 'Visi pareizi — perfekti!' : 'Paldies, ka spēlēji Cikmaksā.lv'}
              </p>
              <div className="bg-[#171717] rounded-2xl p-6 mb-6">
                <p className="text-7xl font-black text-white">{reverseTotalScore}</p>
                <p className="text-white/60 text-sm mt-1 font-medium">no {maxReverseScore} punktiem</p>
              </div>
              <button
                onClick={() => setMode('menu')}
                className="w-full bg-[#F1EFE8] hover:bg-[#EDE6D3] text-[#171717] font-bold text-sm rounded-2xl py-3 transition-all"
              >
                Atpakaļ uz izvēlni
              </button>
            </div>
          </div>
        </div>
      )
    }

    const round = reverseRounds[reverseIndex]
    if (!round) {
      return (
        <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
          <Loader2 className="w-6 h-6 text-[#888780] animate-spin" />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-md md:max-w-lg">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[#888780] text-xs font-semibold uppercase tracking-wide">
              Raunds {reverseIndex + 1}/{reverseRounds.length}
            </span>
            <span className="flex items-center gap-1 bg-[#171717] text-white text-xs font-semibold px-3 py-1 rounded-full">
              {reverseTotalScore} PTS
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] p-6 mb-4 text-center">
            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">Kurš sludinājums maksā šo?</p>
            <p className="text-6xl font-black text-[#171717]">{round.correct.correct_price} €</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {round.options.map((opt) => {
              const optPhotos = opt.image_urls && opt.image_urls.length > 0 ? opt.image_urls : (opt.image_url ? [opt.image_url] : [])
              const isCorrectOption = opt.id === round.correct.id
              const isSelected = opt.id === reverseSelectedId
              let cardStyle = 'border-[#171717]/10 bg-white'
              if (reverseRevealed && isCorrectOption) cardStyle = 'border-[#639922] bg-[#EAF3DE]'
              else if (reverseRevealed && isSelected && !isCorrectOption) cardStyle = 'border-[#A32D2D] bg-[#FCEBEB]'

              return (
                <button
                  key={opt.id}
                  onClick={() => handleReverseGuess(opt.id)}
                  disabled={reverseRevealed}
                  className={`text-left rounded-2xl border-2 overflow-hidden transition-all ${cardStyle} ${!reverseRevealed ? 'hover:border-[#EF9F27] active:scale-[0.97]' : ''}`}
                >
                  <div className="h-24 bg-[#F5EFE0]">
                    {optPhotos.length > 0 && (
                      <img src={optPhotos[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[#171717] text-xs font-bold truncate">{opt.title}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {reverseRevealed && (
            <button
              onClick={handleReverseNext}
              className="w-full mt-4 bg-[#171717] hover:bg-[#2c2c2a] text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
            >
              {reverseIndex + 1 >= reverseRounds.length ? 'Rezultāti →' : 'Nākamais →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // --- LOBBY: kods + reāllaika spēlētāju saraksts ---
  if (mode === 'lobby') {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight text-[#171717] mb-1">Istaba</h1>
            <p className="text-[#5f5e5a] text-sm">
              {isHost ? 'Iedod kodu draugiem un sāc, kad visi gatavi' : 'Gaidi, kamēr saimnieks sāks spēli'}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#171717]/10 p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <div className="text-center mb-7">
              <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-2">Istabas kods</p>
              <div className="inline-block bg-[#EF9F27] rounded-2xl px-6 py-3 -rotate-1 mb-4">
                <p className="text-5xl font-black text-[#412402] tracking-[0.2em]">{roomCode}</p>
              </div>
              <div>
                <button
                  onClick={copyRoomCode}
                  className="inline-flex items-center gap-2 bg-[#F1EFE8] hover:bg-[#EDE6D3] text-[#171717] font-bold text-xs rounded-full px-4 py-2 transition-all"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Nokopēts!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Kopēt kodu
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide mb-3">
              Spēlētāji ({lobbyPlayers.length})
            </p>
            <div className="rounded-2xl border border-[#171717]/10 divide-y divide-[#171717]/[0.06] overflow-hidden mb-7">
              {lobbyPlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#F1EFE8] flex items-center justify-center shrink-0">
                    <span className="text-[#5f5e5a] font-bold text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[#171717] font-bold text-sm flex-1 truncate">{p.name}</span>
                  {p.is_host && <Crown className="w-4 h-4 text-[#EF9F27] shrink-0" />}
                  {isHost && !p.is_host && (
                    <button
                      onClick={() => handleKickPlayer(p.id)}
                      className="text-[#888780] hover:text-[#A32D2D] transition-colors shrink-0"
                      title="Izņemt spēlētāju"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {lobbyPlayers.length === 0 && (
                <div className="flex items-center justify-center gap-2 text-[#888780] text-sm py-6">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ielādē spēlētājus...
                </div>
              )}
            </div>

            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={startingGame || lobbyPlayers.length === 0}
                className="w-full bg-[#171717] hover:bg-[#2c2c2a] disabled:opacity-50 text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
              >
                {startingGame ? 'Sāk...' : 'Sākt spēli →'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[#888780] text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gaida saimnieku...
              </div>
            )}

            <button
              onClick={() => {
                leaveRoom()
                setMode('menu')
              }}
              className="w-full mt-3 text-[#888780] hover:text-[#5f5e5a] font-medium text-xs py-2 transition-colors"
            >
              ← Pamest istabu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#EF9F27] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#5f5e5a] text-sm">Ielādē spēli...</p>
        </div>
      </div>
    )
  }

  // --- SPĒLES BEIGAS: solo rezultāts vai multiplayer tabula ---
  if (gameFinished) {
    const rankedPlayers = finalLeaderboard
      ? [...finalLeaderboard].sort((a, b) => b.score - a.score)
      : []
    const finishStamp = !roomId
      ? totalScore >= questions.length * 80
        ? 'Lieliski nospēlēts!'
        : totalScore >= questions.length * 50
        ? 'Labs rezultāts!'
        : 'Vēl viena spēle?'
      : null

    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-6" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
        <div className="w-full max-w-sm md:max-w-lg animate-[fadeIn_0.4s_ease-out]">
          <div className="bg-white rounded-3xl border border-[#171717]/10 p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
            <div className="inline-block bg-[#EF9F27] rounded-full p-4 -rotate-3 mb-4">
              <Trophy className="w-8 h-8 text-[#412402]" strokeWidth={2.4} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#171717] mb-1">Spēle beigusies!</h1>
            <p className="text-[#5f5e5a] text-sm mb-6">{finishStamp || 'Paldies, ka spēlēji Cikmaksā.lv'}</p>

            {!roomId && (
              <div className="bg-[#171717] rounded-2xl p-6">
                <p className="text-7xl font-black text-white">{totalScore}</p>
                <p className="text-white/60 text-sm mt-1 font-medium">no {questions.length * 100} punktiem</p>
              </div>
            )}

            {roomId && rankedPlayers.length > 0 && (
              <div className="flex flex-col gap-2 text-left">
                {rankedPlayers.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 border-2 ${
                      i === 0
                        ? 'bg-[#EF9F27] border-[#EF9F27]'
                        : 'bg-white border-[#171717]/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                        i === 0 ? 'bg-white text-[#412402]' : 'bg-[#F1EFE8] text-[#5f5e5a]'
                      }`}
                    >
                      {i === 0 ? <Trophy className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className="font-bold text-sm flex-1 truncate text-[#171717]">
                      {p.name}{p.id === playerId ? ' (tu)' : ''}
                    </span>
                    <span className="font-black text-sm text-[#171717]">
                      {p.score} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                leaveRoom()
                setMode('menu')
              }}
              className="w-full mt-6 bg-[#F1EFE8] hover:bg-[#EDE6D3] text-[#171717] font-bold text-sm rounded-2xl py-3 transition-all"
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

  const roundResults = roomId
    ? [...roundAnswers]
        .map((a) => {
          const player = lobbyPlayers.find((p) => p.id === a.player_id)
          return {
            playerId: a.player_id,
            name: player ? player.name : '???',
            guess: a.guess,
            score: calculateScore(a.guess, question.correct_price),
          }
        })
        .sort((a, b) => b.score - a.score)
    : []

  const guessNum = Number(guess)
  const diffAmount = revealed ? guessNum - question.correct_price : 0
  const timerPct = selectedTimer > 0 ? (timeLeft / selectedTimer) * 100 : 100
  const timerColor = timeLeft <= 5 ? 'text-[#A32D2D]' : timeLeft <= 10 ? 'text-[#854F0B]' : 'text-[#5f5e5a]'
  const timerBarColor = timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-[#EF9F27]'

  async function handleGuess() {
    const score = calculateScore(Number(guess), question.correct_price)
    setLastRoundScore(score)
    setTotalScore((prev) => prev + score)
    if (roomId) {
      setSubmitted(true)
      await recordMultiplayerAnswer(question, Number(guess), score)
    } else {
      setRevealed(true)
    }
  }

  async function handleNext() {
    if (roomId) {
      if (!isHost) return
      const nextIndex = currentIndex + 1
      await supabase
        .from('rooms')
        .update({ current_question_index: nextIndex })
        .eq('id', roomId)
      return
    }

    if (currentIndex + 1 >= questions.length) {
      setGameFinished(true)
      if (authUser) {
        updateProfileStats(totalScoreRef.current)
        supabase.from('game_sessions').insert({
          user_id: authUser.id,
          category: selectedCategory,
          rounds: selectedRounds,
          score: totalScoreRef.current,
        })
      }
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  function prevPhoto() {
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  function nextPhoto() {
    setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const resultStamp = lastRoundScore >= 90
    ? { label: 'Trāpīji!', bg: 'bg-[#639922]', text: 'text-[#EAF3DE]' }
    : lastRoundScore >= 60
    ? { label: 'Tuvu!', bg: 'bg-[#EF9F27]', text: 'text-[#412402]' }
    : { label: 'Garām', bg: 'bg-[#D85A30]', text: 'text-[#FAECE7]' }

  return (
    <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center p-4" style={{ backgroundImage: PAGE_BG_PATTERN, backgroundRepeat: 'repeat' }}>
      <div className="w-full max-w-md md:max-w-lg">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[#888780] text-xs font-semibold uppercase tracking-wide">
            Raunds {currentIndex + 1}/{questions.length}
          </span>
          <div className="flex items-center gap-2">
            {roomId && (
              <span className="flex items-center gap-1 bg-[#F1EFE8] text-[#5f5e5a] text-xs font-medium px-3 py-1 rounded-full">
                <Users className="w-3.5 h-3.5" />
                {roundAnswers.length}/{lobbyPlayers.length}
              </span>
            )}
            {!revealed && selectedTimer > 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium ${timerColor}`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft}s
              </span>
            )}
            <span className="flex items-center gap-1 bg-[#171717] text-white text-xs font-semibold px-3 py-1 rounded-full">
              {totalScore} PTS
            </span>
          </div>
        </div>

        <div className="w-full h-1 bg-[#F1EFE8] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#171717] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {!revealed && selectedTimer > 0 && (
          <div className="w-full h-0.5 bg-[#F1EFE8] rounded-full -mt-3 mb-4 overflow-hidden">
            <div
              className={`h-full ${timerBarColor} rounded-full transition-all duration-1000 ease-linear`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}

        <div className={`transition-all duration-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {photos.length > 0 && (
            <div className="relative">
              <div className="relative w-full h-64 md:h-80 bg-[#171717] rounded-3xl overflow-hidden">
                <img src={photos[photoIndex]} alt="" className="w-full h-full object-cover" />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            i === photoIndex ? 'bg-white' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-3 right-3 bg-white text-[#171717] text-xs font-bold px-3 py-1.5 rounded-full">
                  {currentIndex + 1}/{questions.length}
                </div>
              </div>
              <div className="absolute -bottom-4 left-5 bg-[#EF9F27] rounded-lg px-3.5 py-2 -rotate-3 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <Icon className="w-4 h-4 text-[#412402]" strokeWidth={2.4} />
                <span className="text-[#412402] text-[11px] font-bold uppercase tracking-wide">
                  {question.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[#171717]/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)] pt-7 px-6 pb-6 mt-2">
            <h1 className="text-2xl font-black tracking-tight text-[#171717] mb-1 leading-snug">{question.title}</h1>
            <p className="text-[#5f5e5a] text-sm mb-5">{question.details}</p>

            {specEntries.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {specEntries.map(([label, value]) => {
                  const SpecIcon = getSpecIcon(label)
                  return (
                    <div key={label} className="flex items-center gap-2 bg-[#F5EFE0] border border-[#171717]/[0.06] rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-[#171717]/10 flex items-center justify-center shrink-0">
                        <SpecIcon className="w-3.5 h-3.5 text-[#5f5e5a]" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#171717] text-xs font-semibold truncate leading-tight">{value}</p>
                        <p className="text-[#888780] text-[8px] font-medium uppercase truncate leading-tight">{label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {roomId && !revealed && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {lobbyPlayers.map((p) => {
                  const hasAnswered = roundAnswers.some((a) => a.player_id === p.id)
                  return (
                    <span
                      key={p.id}
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        hasAnswered ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#F1EFE8] text-[#888780]'
                      }`}
                    >
                      {hasAnswered ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      {p.name}
                    </span>
                  )
                })}
              </div>
            )}

            {!submitted && !revealed && (
              <div className="flex flex-col gap-3">
                <p className="text-[#888780] text-xs font-semibold uppercase tracking-wide">Cik maksā šis sludinājums?</p>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#888780] font-black text-2xl">
                    €
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && guess && handleGuess()}
                    autoFocus
                    className="w-full bg-[#F5EFE0] text-[#171717] text-4xl font-black rounded-2xl pl-14 pr-5 py-5 outline-none border-2 border-[#171717]/10 focus:border-[#EF9F27] transition-colors"
                  />
                </div>
                <button
                  onClick={handleGuess}
                  disabled={!guess}
                  className="bg-[#171717] hover:bg-[#2c2c2a] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl py-4 transition-all duration-150 active:scale-[0.96]"
                >
                  Minēt cenu
                </button>
              </div>
            )}

            {submitted && !revealed && (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 text-[#888780] animate-spin" />
                <p className="text-[#5f5e5a] text-sm font-medium">Gaidi pārējos spēlētājus...</p>
                <p className="text-[#888780] text-xs">{roundAnswers.length}/{lobbyPlayers.length} atbildējuši</p>
              </div>
            )}

            {revealed && (
              <div className="flex flex-col gap-3 animate-[fadeIn_0.3s_ease-out]">
                {!roomId && (
                  <div className="text-center py-2">
                    <div className={`inline-block ${resultStamp.bg} ${resultStamp.text} text-sm font-bold px-4 py-1.5 rounded-full -rotate-2 mb-4`}>
                      {resultStamp.label}
                    </div>
                    <p className="text-5xl font-black text-[#171717] mb-1">{question.correct_price} €</p>
                    <p className="text-[#888780] text-xs font-medium mb-3">bija pareizā cena</p>
                    <p className="text-[#5f5e5a] text-sm">
                      Tavs minējums: <span className="font-bold text-[#171717]">{guess || 0} €</span>
                      {diffAmount !== 0 && (
                        <span> ({diffAmount > 0 ? '+' : ''}{diffAmount} €)</span>
                      )}
                    </p>
                  </div>
                )}

                {roomId && (
                  <>
                    <div className="text-center py-2">
                      <div className={`inline-block ${resultStamp.bg} ${resultStamp.text} text-sm font-bold px-4 py-1.5 rounded-full -rotate-2 mb-4`}>
                        {resultStamp.label}
                      </div>
                      <p className="text-4xl font-black text-[#171717]">{question.correct_price} €</p>
                      <p className="text-[#888780] text-xs font-medium mt-1">bija pareizā cena</p>
                    </div>

                    <div className="rounded-2xl border border-[#171717]/10 divide-y divide-[#171717]/[0.06] overflow-hidden">
                      {roundResults.map((r, i) => (
                        <div key={r.playerId} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#F1EFE8] flex items-center justify-center shrink-0 text-[#5f5e5a] font-semibold text-xs">
                            {i === 0 ? <Trophy className="w-3.5 h-3.5 text-[#854F0B]" /> : r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[#171717] font-medium text-sm flex-1 truncate">
                            {r.name}{r.playerId === playerId ? ' (tu)' : ''}
                          </span>
                          <span className="text-[#5f5e5a] text-xs">{r.guess} €</span>
                          <span className="text-[#171717] font-semibold text-sm w-10 text-right">+{r.score}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="text-center py-5 bg-[#EF9F27] rounded-2xl">
                  <p className="text-5xl font-black text-[#171717]">
                    +{lastRoundScore}
                  </p>
                  <p className="text-[#412402]/70 text-xs font-bold uppercase tracking-wide mt-1">punkti šajā raundā</p>
                </div>

                {question.source_url && (
                  <a
                    href={question.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[#888780] hover:text-[#171717] text-xs font-medium py-1 transition-colors"
                  >
                    Skatīt sludinājumu SS.LV ↗
                  </a>
                )}

                {!roomId && (
                  <button
                    onClick={handleNext}
                    className="bg-[#171717] hover:bg-[#2c2c2a] text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
                  >
                    Nākamais →
                  </button>
                )}

                {roomId && isHost && (
                  <button
                    onClick={handleNext}
                    className="bg-[#171717] hover:bg-[#2c2c2a] text-white font-bold text-base rounded-2xl py-4 transition-all active:scale-[0.96]"
                  >
                    {currentIndex + 1 >= questions.length ? 'Parādīt rezultātus →' : 'Nākamais raundam →'}
                  </button>
                )}

                {roomId && !isHost && (
                  <div className="flex items-center justify-center gap-2 text-[#888780] text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gaida saimnieku...
                  </div>
                )}
              </div>
            )}
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