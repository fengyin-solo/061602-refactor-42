import type { GameState, BerryType, Berry } from '@/types/game'
import {
  BERRY_SPAWN_INTERVAL, BERRY_MAX_COUNT, BERRY_LIFETIME, BERRY_VALUES,
} from '@/utils/constants'
import { randomChoice, randomFloat, generateId } from '@/utils/random'

const BERRY_TYPES: BerryType[] = ['red', 'red', 'red', 'blue', 'blue', 'golden']

export function useBerrySystem() {
  const spawnInterval = BERRY_SPAWN_INTERVAL

  const spawn = (state: GameState) => {
    if (state.berries.length >= BERRY_MAX_COUNT) return
    const type = randomChoice(BERRY_TYPES)
    state.berries.push({
      id: generateId(),
      x: randomFloat(5, 95),
      y: randomFloat(10, 85),
      value: BERRY_VALUES[type],
      type,
      spawnedAt: Date.now(),
    })
  }

  const cleanupExpired = (state: GameState, now: number) => {
    state.berries = state.berries.filter(b => now - b.spawnedAt < BERRY_LIFETIME)
  }

  const collect = (state: GameState, berryId: string): number => {
    const idx = state.berries.findIndex((b: Berry) => b.id === berryId)
    if (idx === -1) return 0
    const berry = state.berries[idx]
    state.foodStock += berry.value
    state.berries.splice(idx, 1)
    return berry.value
  }

  return {
    spawnInterval,
    spawn,
    cleanupExpired,
    collect,
  }
}
