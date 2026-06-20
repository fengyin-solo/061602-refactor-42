import type { Bird, GrowthStage, GameState, UpdateContext } from '@/types/game'
import { STAGE_DURATION, DAY_DURATION } from '@/utils/constants'
import { useBirdFactory } from './useBirdFactory'

const GROWTH_ORDER: GrowthStage[] = ['egg', 'chick', 'juvenile', 'subadult', 'adult']

export function useGrowthSystem() {
  const factory = useBirdFactory()

  const tryHatch = (
    bird: Bird,
    ctx: UpdateContext,
    state: GameState,
    log: (msg: string, type?: string) => void
  ): boolean => {
    if (bird.stage !== 'egg') return false
    bird.hatchTimeLeft -= ctx.deltaMs
    if (bird.hatchTimeLeft > 0) return false

    factory.initBirdFromEgg(bird, state.birds)
    state.totalHatched++
    log(`🥳 ${bird.name} 破壳啦！性格：${bird.personality}`, 'success')
    return true
  }

  const tryGrow = (
    bird: Bird,
    ctx: UpdateContext,
    log: (msg: string, type?: string) => void,
    onAllAdult: () => void
  ): boolean => {
    if (bird.stage === 'egg' || bird.stage === 'adult') return false

    const stageKey = bird.stage as Exclude<GrowthStage, 'adult'>
    const stageDuration = STAGE_DURATION[stageKey] * DAY_DURATION
    bird.stageProgress += ctx.deltaMs / stageDuration

    const healthMod = bird.health / 100
    if (bird.stageProgress * healthMod < 1) return false

    const currentIdx = GROWTH_ORDER.indexOf(bird.stage)
    if (currentIdx >= GROWTH_ORDER.length - 1) return false

    bird.stage = GROWTH_ORDER[currentIdx + 1]
    bird.stageProgress = 0
    bird.justGrew = true
    log(`🌟 ${bird.name} 成长为${bird.stage}啦！`, 'success')

    if (bird.stage === 'adult') {
      onAllAdult()
    }
    return true
  }

  const resetTransitionFlags = (bird: Bird) => {
    if (bird.justHatched) bird.justHatched = false
    if (bird.justGrew) bird.justGrew = false
    if (bird.justFed) bird.justFed = false
  }

  return {
    tryHatch,
    tryGrow,
    resetTransitionFlags,
  }
}
