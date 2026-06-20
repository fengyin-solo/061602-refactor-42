import type { Bird, UpdateContext } from '@/types/game'
import { randomInt, chance } from '@/utils/random'

const tryRestoreStatus = (
  bird: Bird,
  ctx: UpdateContext,
  log: (msg: string, type?: string) => void
) => {
  if (bird.isAway && bird.awayUntil && ctx.now >= bird.awayUntil) {
    bird.isAway = false
    log(`🏠 ${bird.name} 回巢了~`, 'success')
  }
  if (bird.isSick && bird.sickUntil && ctx.now >= bird.sickUntil) {
    bird.isSick = false
    log(`💚 ${bird.name} 康复了！`, 'success')
  }
}

const tryTriggerAway = (
  bird: Bird,
  ctx: UpdateContext,
  log: (msg: string, type?: string) => void
) => {
  if (!ctx.weatherEffect.awayChance) return
  if (bird.isAway || bird.stage === 'chick') return

  const personalityMod = bird.personality === 'bold' ? 0.3 : bird.personality === 'shy' ? 1.5 : 1
  const probability = ctx.weatherEffect.awayChance * personalityMod * (ctx.deltaMs / 10000)

  if (chance(probability)) {
    bird.isAway = true
    bird.awayUntil = ctx.now + randomInt(8000, 20000)
    log(`💨 ${bird.name} 被天气吓跑，暂时离巢了...`, 'warning')
  }
}

const tryTriggerSick = (
  bird: Bird,
  ctx: UpdateContext,
  log: (msg: string, type?: string) => void
) => {
  if (!ctx.weatherEffect.sickChance) return
  if (bird.isSick || bird.isAway) return

  const personalityMod = bird.personality === 'stubborn' ? 0.7 : bird.personality === 'gentle' ? 1.3 : 1
  const probability = ctx.weatherEffect.sickChance * personalityMod * (ctx.deltaMs / 10000)

  if (chance(probability)) {
    bird.isSick = true
    bird.sickUntil = ctx.now + randomInt(10000, 25000)
    log(`🤒 ${bird.name} 生病了，需要好好照顾！`, 'warning')
  }
}

export function useEventSystem() {
  const update = (
    bird: Bird,
    ctx: UpdateContext,
    log: (msg: string, type?: string) => void
  ) => {
    if (bird.isDead) return
    tryRestoreStatus(bird, ctx, log)
    if (bird.stage === 'egg' || bird.isAway) return
    tryTriggerAway(bird, ctx, log)
    tryTriggerSick(bird, ctx, log)
  }

  return {
    update,
  }
}
