import type { GameState, GameScore } from '@/types/game'
import { clamp } from '@/utils/random'

export function useScoreSystem() {
  const calculate = (state: GameState): GameScore => {
    const totalBirds = state.totalHatched
    const survived = state.birds.filter(b => !b.isDead).length + state.totalDied
    const survivalRate = totalBirds > 0 ? (survived - state.totalDied) / totalBirds : 0

    const aliveBirds = state.birds.filter(b => !b.isDead)
    const avgHealth = aliveBirds.length > 0
      ? aliveBirds.reduce((s, b) => s + b.health, 0) / aliveBirds.length
      : 0

    const breedingBonus = state.breedingCount * 20
    const personalityBonus = aliveBirds.length > 0
      ? aliveBirds.reduce((s, b) => s + (b.feedingCount > 10 ? 5 : 2), 0)
      : 0

    const totalScore = Math.round(
      survivalRate * 40 +
      avgHealth * 0.3 +
      breedingBonus +
      personalityBonus
    )

    let stars = 1
    if (totalScore >= 80) stars = 5
    else if (totalScore >= 65) stars = 4
    else if (totalScore >= 50) stars = 3
    else if (totalScore >= 30) stars = 2

    const rank = stars >= 5 ? '🏆 传奇养鸟人'
      : stars === 4 ? '🥇 金牌养鸟人'
      : stars === 3 ? '🥈 银牌养鸟人'
      : stars === 2 ? '🥉 铜牌养鸟人'
      : '🌱 新手养鸟人'

    return {
      totalScore: clamp(totalScore, 0, 100),
      survivalRate: Math.round(survivalRate * 100),
      avgHealth: Math.round(avgHealth),
      breedingBonus,
      personalityBonus,
      stars,
      rank,
    }
  }

  return {
    calculate,
  }
}
