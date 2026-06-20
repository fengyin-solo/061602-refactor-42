import type { GameState, Weather, WeatherEffect } from '@/types/game'
import { WEATHER_CHANGE_INTERVAL, WEATHER_EFFECTS } from '@/utils/constants'
import { randomChoice, randomInt } from '@/utils/random'

const WEATHERS: Weather[] = ['sunny', 'rainy', 'snowy', 'stormy']

export function useWeatherSystem() {
  const getEffects = (weather: Weather): WeatherEffect => WEATHER_EFFECTS[weather]

  const tryChange = (state: GameState, now: number, log: (msg: string, type?: string) => void): boolean => {
    if (now < state.nextWeatherChangeAt) return false
    const newWeather = randomChoice(WEATHERS.filter(w => w !== state.currentWeather))
    state.currentWeather = newWeather
    state.nextWeatherChangeAt = now + WEATHER_CHANGE_INTERVAL + randomInt(-10000, 10000)
    log(`🌤️ 天气变化：${newWeather}`, 'info')
    return true
  }

  return {
    getEffects,
    tryChange,
  }
}
