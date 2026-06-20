import { reactive, computed, watch } from 'vue'
import type { GameState, UpdateContext } from '@/types/game'
import {
  DAY_DURATION, INITIAL_FOOD, MAX_BREEDING_ROUNDS, WEATHER_CHANGE_INTERVAL,
} from '@/utils/constants'
import { generateId } from '@/utils/random'
import { saveGame, loadGame, clearSave } from '@/utils/storage'

import { useBirdFactory } from './useBirdFactory'
import { useWeatherSystem } from './useWeatherSystem'
import { useGrowthSystem } from './useGrowthSystem'
import { useAttributeSystem } from './useAttributeSystem'
import { useEventSystem } from './useEventSystem'
import { useDeathSystem } from './useDeathSystem'
import { useInteractionSystem } from './useInteractionSystem'
import { useBerrySystem } from './useBerrySystem'
import { useBreedingSystem } from './useBreedingSystem'
import { useScoreSystem } from './useScoreSystem'

const createInitialState = (): GameState => ({
  phase: 'start',
  day: 1,
  dayProgress: 0,
  currentWeather: 'sunny',
  nextWeatherChangeAt: Date.now() + WEATHER_CHANGE_INTERVAL,
  foodStock: INITIAL_FOOD,
  birds: [],
  berries: [],
  totalHatched: 0,
  totalDied: 0,
  breedingCount: 0,
  maxBreedingRounds: MAX_BREEDING_ROUNDS,
  eventLog: [],
})

const state = reactive<GameState>(createInitialState())

let gameLoopTimer: ReturnType<typeof setInterval> | null = null
let berrySpawnTimer: ReturnType<typeof setInterval> | null = null

const factory = useBirdFactory()
const weatherSys = useWeatherSystem()
const growthSys = useGrowthSystem()
const attrSys = useAttributeSystem()
const eventSys = useEventSystem()
const deathSys = useDeathSystem()
const interactSys = useInteractionSystem()
const berrySys = useBerrySystem()
const breedingSys = useBreedingSystem()
const scoreSys = useScoreSystem()

const addEventLog = (message: string, type: string = 'info') => {
  state.eventLog.unshift({
    id: generateId(),
    message,
    type,
    timestamp: Date.now(),
  })
  if (state.eventLog.length > 50) state.eventLog.pop()
}

const allAdults = computed(() => breedingSys.allAdults(state))
const aliveCount = computed(() => state.birds.filter(b => !b.isDead).length)

const endGame = (_reason: string) => {
  stopGameLoop()
  state.phase = 'ended'
  state.score = scoreSys.calculate(state)
  addEventLog('🎮 游戏结束', 'info')
  saveGame(state)
}

const checkGameEnd = () => {
  if (aliveCount.value === 0 && state.phase === 'playing') {
    endGame('allDead')
  }
}

const advanceDay = (deltaMs: number) => {
  state.dayProgress += deltaMs / DAY_DURATION
  if (state.dayProgress >= 1) {
    state.dayProgress -= 1
    state.day += 1
    addEventLog(`📅 第 ${state.day} 天开始了！`, 'info')
  }
}

const updateBirdPipeline = (ctx: UpdateContext) => {
  const aliveBirds = state.birds.filter(b => !b.isDead)

  for (const bird of aliveBirds) {
    eventSys.update(bird, ctx, addEventLog)
    if (growthSys.tryHatch(bird, ctx, state, addEventLog)) continue
    if (bird.isAway) continue

    attrSys.update(bird, ctx)

    if (deathSys.shouldDie(bird)) {
      deathSys.kill(bird, state, addEventLog)
      continue
    }

    growthSys.resetTransitionFlags(bird)
    growthSys.tryGrow(bird, ctx, addEventLog, () => breedingSys.onAllAdult(state, addEventLog))
  }
}

const updateGame = (deltaMs: number) => {
  if (state.phase !== 'playing' && state.phase !== 'breeding') return

  const now = Date.now()
  advanceDay(deltaMs)
  weatherSys.tryChange(state, now, addEventLog)

  const ctx: UpdateContext = {
    deltaMs,
    now,
    weather: state.currentWeather,
    weatherEffect: weatherSys.getEffects(state.currentWeather),
  }

  updateBirdPipeline(ctx)
  berrySys.cleanupExpired(state, now)
  checkGameEnd()
  saveGame(state)
}

const startGameLoop = () => {
  stopGameLoop()
  const tick = 100

  gameLoopTimer = setInterval(() => {
    updateGame(tick)
  }, tick)

  berrySpawnTimer = setInterval(() => {
    berrySys.spawn(state)
  }, berrySys.spawnInterval)
}

const stopGameLoop = () => {
  if (gameLoopTimer) {
    clearInterval(gameLoopTimer)
    gameLoopTimer = null
  }
  if (berrySpawnTimer) {
    clearInterval(berrySpawnTimer)
    berrySpawnTimer = null
  }
}

const startGame = () => {
  Object.assign(state, createInitialState())
  factory.clearNames()
  state.phase = 'playing'
  clearSave()

  const eggs = factory.createEggBatch(0)
  state.birds.push(...eggs)

  addEventLog(`🎉 新的一窝！鸟巢里有 ${eggs.length} 颗蛋在等待孵化~`, 'success')
  startGameLoop()
  saveGame(state)
}

const restartGame = () => {
  stopGameLoop()
  startGame()
}

const returnToStart = () => {
  stopGameLoop()
  Object.assign(state, createInitialState())
  clearSave()
}

const tryLoadGame = (): boolean => {
  const saved = loadGame()
  if (saved && saved.phase === 'playing' || saved?.phase === 'breeding') {
    Object.assign(state, saved)
    startGameLoop()
    return true
  }
  return false
}

const collectBerry = (berryId: string) => berrySys.collect(state, berryId)
const feedBird = (birdId: string, amount: number): boolean => interactSys.feed(birdId, amount, state)
const calmBird = (birdId: string): boolean => interactSys.calm(birdId, state)
const buryBird = (birdId: string) => deathSys.bury(birdId, state, addEventLog)
const releaseBirds = () => breedingSys.release(state, addEventLog, endGame)
const keepAndBreed = () => breedingSys.tryBreed(state, addEventLog, endGame)

watch(
  () => state.phase,
  (phase) => {
    if (phase === 'ended') {
      stopGameLoop()
    }
  }
)

export function useGameState() {
  return {
    state,
    startGame,
    stopGameLoop,
    collectBerry,
    feedBird,
    calmBird,
    buryBird,
    releaseBirds,
    keepAndBreed,
    restartGame,
    returnToStart,
    tryLoadGame,
    allAdults,
    aliveCount,
  }
}
