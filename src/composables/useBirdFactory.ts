import type { Bird, Personality } from '@/types/game'
import { BIRD_NAMES, MIN_EGGS, MAX_EGGS } from '@/utils/constants'
import { randomInt, randomChoice, generateId } from '@/utils/random'

const PERSONALITIES: Personality[] = ['bold', 'shy', 'gentle', 'curious', 'stubborn']
const usedNames = new Set<string>()

export function useBirdFactory() {
  const clearNames = () => usedNames.clear()

  const pickName = (): string => {
    const available = BIRD_NAMES.filter(n => !usedNames.has(n))
    if (available.length === 0) {
      usedNames.clear()
      return randomChoice(BIRD_NAMES)
    }
    const name = randomChoice(available)
    usedNames.add(name)
    return name
  }

  const generatePersonality = (hatchDuration: number, avgHatchDuration: number): Personality => {
    const ratio = hatchDuration / avgHatchDuration
    if (ratio < 0.85) return randomChoice(['curious', 'bold'])
    if (ratio > 1.15) return randomChoice(['shy', 'gentle'])
    return randomChoice(PERSONALITIES)
  }

  const createEgg = (index: number): Bird => {
    const hatchDuration = randomInt(15000, 35000)
    return {
      id: generateId(),
      name: `蛋${index + 1}号`,
      stage: 'egg',
      stageProgress: 0,
      hunger: 100,
      fear: randomInt(10, 30),
      health: randomInt(85, 100),
      personality: 'gentle',
      hatchDuration,
      hatchTimeLeft: hatchDuration,
      isAway: false,
      isSick: false,
      isDead: false,
      feedingCount: 0,
      lastFedAt: 0,
    }
  }

  const createEggBatch = (startIndex: number, count?: number): Bird[] => {
    const eggCount = count ?? randomInt(MIN_EGGS, MAX_EGGS)
    const eggs: Bird[] = []
    for (let i = 0; i < eggCount; i++) {
      eggs.push(createEgg(startIndex + i))
    }
    return eggs
  }

  const initBirdFromEgg = (bird: Bird, allBirds: Bird[]) => {
    const avgHatch = allBirds.reduce((s, b) => s + b.hatchDuration, 0) / allBirds.length
    bird.stage = 'chick'
    bird.stageProgress = 0
    bird.personality = generatePersonality(bird.hatchDuration, avgHatch)
    bird.name = pickName()
    bird.hunger = randomInt(50, 70)
    bird.fear = randomInt(20, 50)
    bird.health = randomInt(75, 95)
    bird.justHatched = true
  }

  return {
    clearNames,
    pickName,
    createEgg,
    createEggBatch,
    initBirdFromEgg,
  }
}
