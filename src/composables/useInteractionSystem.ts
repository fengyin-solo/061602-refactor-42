import type { Bird, GameState } from '@/types/game'
import { ATTR_MIN, ATTR_MAX } from '@/utils/constants'
import { randomInt, clamp } from '@/utils/random'

export function useInteractionSystem() {
  const canInteract = (bird: Bird): boolean => {
    return !bird.isDead && !bird.isAway && bird.stage !== 'egg'
  }

  const feed = (
    birdId: string,
    amount: number,
    state: GameState
  ): boolean => {
    const bird = state.birds.find(b => b.id === birdId)
    if (!bird || !canInteract(bird)) return false
    if (state.foodStock < amount) return false

    state.foodStock -= amount
    bird.hunger = clamp(bird.hunger + amount, ATTR_MIN, ATTR_MAX)
    bird.feedingCount++
    bird.lastFedAt = Date.now()
    bird.justFed = true

    if (bird.fear > 20) {
      const fearReduce = bird.personality === 'shy' ? 3 : bird.personality === 'gentle' ? 5 : 4
      bird.fear = clamp(bird.fear - fearReduce, ATTR_MIN, ATTR_MAX)
    }
    return true
  }

  const calm = (
    birdId: string,
    state: GameState
  ): boolean => {
    const bird = state.birds.find(b => b.id === birdId)
    if (!bird || !canInteract(bird)) return false
    bird.fear = clamp(bird.fear - randomInt(8, 15), ATTR_MIN, ATTR_MAX)
    return true
  }

  return {
    canInteract,
    feed,
    calm,
  }
}
