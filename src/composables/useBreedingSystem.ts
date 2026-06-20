import type { GameState } from '@/types/game'
import { ATTR_MIN, ATTR_MAX } from '@/utils/constants'
import { randomInt, clamp } from '@/utils/random'
import { useBirdFactory } from './useBirdFactory'

export function useBreedingSystem() {
  const factory = useBirdFactory()

  const tryBreed = (
    state: GameState,
    log: (msg: string, type?: string) => void,
    endGame: (reason: string) => void
  ): boolean => {
    const adults = state.birds.filter(b => b.stage === 'adult' && !b.isDead)
    if (adults.length < 2 || state.breedingCount >= state.maxBreedingRounds) {
      endGame('keep')
      return false
    }

    state.breedingCount++
    state.phase = 'breeding'

    adults.forEach(b => {
      b.hunger = clamp(b.hunger - randomInt(10, 20), ATTR_MIN, ATTR_MAX)
    })

    const newEggs = factory.createEggBatch(state.birds.length)
    state.birds.push(...newEggs)

    log(`💝 成鸟们产下了 ${newEggs.length} 颗新蛋！第 ${state.breedingCount} 窝`, 'success')
    state.phase = 'playing'
    return true
  }

  const release = (
    state: GameState,
    log: (msg: string, type?: string) => void,
    endGame: (reason: string) => void
  ) => {
    const adults = state.birds.filter(b => b.stage === 'adult' && !b.isDead)
    adults.forEach(b => log(`🕊️ ${b.name} 飞向了自由的天空！`, 'success'))
    endGame('release')
  }

  const allAdults = (state: GameState): boolean => {
    const alive = state.birds.filter(b => !b.isDead)
    return alive.length > 0 && alive.every(b => b.stage === 'adult')
  }

  const onAllAdult = (
    state: GameState,
    log: (msg: string, type?: string) => void
  ) => {
    if (allAdults(state)) {
      log(`🎉 所有小鸟都已长成成鸟！请选择放飞或留下配对~`, 'success')
    }
  }

  return {
    tryBreed,
    release,
    allAdults,
    onAllAdult,
  }
}
