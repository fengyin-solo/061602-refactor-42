import type { Bird, GrowthStage, UpdateContext } from '@/types/game'
import {
  ATTR_MIN, ATTR_MAX,
  FOOD_NEED_MULTIPLIER,
  HUNGER_DECAY_RATE, FEAR_DECAY_RATE, HEALTH_RECOVERY_RATE,
} from '@/utils/constants'
import { clamp } from '@/utils/random'

const getStageMultiplier = (stage: GrowthStage): number => {
  if (stage in FOOD_NEED_MULTIPLIER) {
    return FOOD_NEED_MULTIPLIER[stage as keyof typeof FOOD_NEED_MULTIPLIER]
  }
  return 1
}

const decayHunger = (bird: Bird, ctx: UpdateContext) => {
  const stageMultiplier = getStageMultiplier(bird.stage)
  const decay = HUNGER_DECAY_RATE * ctx.weatherEffect.hungerMod * stageMultiplier * (ctx.deltaMs / 1000)
  bird.hunger = clamp(bird.hunger - decay, ATTR_MIN, ATTR_MAX)
}

const updateFear = (bird: Bird, ctx: UpdateContext) => {
  if (ctx.weatherEffect.fearMod > 1) {
    const increase = (ctx.weatherEffect.fearMod - 1) * 2 * (ctx.deltaMs / 1000)
    bird.fear = clamp(bird.fear + increase, ATTR_MIN, ATTR_MAX)
  } else {
    const decay = FEAR_DECAY_RATE * ctx.weatherEffect.fearMod * (ctx.deltaMs / 1000)
    bird.fear = clamp(bird.fear - decay, ATTR_MIN, ATTR_MAX)
  }
}

const updateHealth = (bird: Bird, ctx: UpdateContext) => {
  if (bird.isSick) {
    bird.health = clamp(bird.health - 0.8 * (ctx.deltaMs / 1000), ATTR_MIN, ATTR_MAX)
    return
  }
  if (bird.hunger < 30) {
    bird.health = clamp(bird.health - 0.4 * (ctx.deltaMs / 1000), ATTR_MIN, ATTR_MAX)
    return
  }
  if (bird.hunger > 70 && bird.fear < 50) {
    const recovery = HEALTH_RECOVERY_RATE * ctx.weatherEffect.healthMod * (ctx.deltaMs / 1000)
    bird.health = clamp(bird.health + recovery, ATTR_MIN, ATTR_MAX)
  }
}

export function useAttributeSystem() {
  const update = (bird: Bird, ctx: UpdateContext) => {
    if (bird.stage === 'egg' || bird.isAway) return
    decayHunger(bird, ctx)
    updateFear(bird, ctx)
    updateHealth(bird, ctx)
  }

  return {
    update,
  }
}
