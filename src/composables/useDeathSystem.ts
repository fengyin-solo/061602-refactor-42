import type { Bird, GameState } from '@/types/game'
import { DEATH_THRESHOLD, ATTR_MIN, ATTR_MAX } from '@/utils/constants'
import { randomInt, clamp } from '@/utils/random'

export function useDeathSystem() {
  const shouldDie = (bird: Bird): boolean => bird.health <= DEATH_THRESHOLD

  const kill = (
    bird: Bird,
    state: GameState,
    log: (msg: string, type?: string) => void
  ) => {
    bird.isDead = true
    state.totalDied++
    log(`💔 ${bird.name} 离开了我们...`, 'danger')

    state.birds
      .filter(b => !b.isDead && b.stage !== 'egg')
      .forEach(survivor => {
        survivor.fear = clamp(survivor.fear + randomInt(15, 30), ATTR_MIN, ATTR_MAX)
        if (survivor.personality === 'gentle' || survivor.personality === 'shy') {
          survivor.health = clamp(survivor.health - randomInt(5, 15), ATTR_MIN, ATTR_MAX)
        }
      })
  }

  const bury = (
    birdId: string,
    state: GameState,
    log: (msg: string, type?: string) => void
  ): boolean => {
    const bird = state.birds.find(b => b.id === birdId)
    if (!bird || !bird.isDead) return false

    state.birds = state.birds.filter(b => b.id !== birdId)
    log(`🕊️ 已将 ${bird.name} 埋葬在树下...`, 'info')

    state.birds
      .filter(b => !b.isDead)
      .forEach(survivor => {
        survivor.fear = clamp(survivor.fear - randomInt(5, 10), ATTR_MIN, ATTR_MAX)
      })
    return true
  }

  return {
    shouldDie,
    kill,
    bury,
  }
}
