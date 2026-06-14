import type { Experiment } from '@/lib/experiments'

import { cursorExperiments }     from './cursor'
import { typographyExperiments } from './typography'
import { simulationExperiments } from './simulation'
import { othersExperiments }     from './others'

// MASTER LIST
export const allExperiments: Experiment[] = [
    ...cursorExperiments,
    ...typographyExperiments,
    ...simulationExperiments,
    ...othersExperiments,
]

export { getExperiment, getByCategory, getAdjacentExperiments } from '@/lib/experiments'