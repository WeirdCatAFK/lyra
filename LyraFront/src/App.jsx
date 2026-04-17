import { useState } from 'react'
import { ExerciseInterface } from './components/exercise/ExerciseInterface.jsx'
import { ExerciseResultOverlay } from './components/exercise/ExerciseResultOverlay.jsx'
import HomePage from './components/HomePage.jsx'
import { useExerciseSession } from './hooks/useExerciseSession.js'
import { EXERCISES } from './lib/exercises.js'

export default function App() {
  const [page, setPage] = useState('home')
  const { currentConfig, index, lastResult, isTransitioning, advance, jumpTo } =
    useExerciseSession(EXERCISES)

  if (page === 'home') {
    return <HomePage onStart={() => setPage('exercise')} />
  }

  return (
    <div className="relative w-full h-screen">
      <ExerciseInterface
        config={currentConfig}
        devExercises={EXERCISES}
        devExerciseIndex={index}
        onDevSelectExercise={jumpTo}
      />
      {isTransitioning && (
        <ExerciseResultOverlay result={lastResult} onNext={advance} />
      )}
    </div>
  )
}
