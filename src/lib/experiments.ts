import type { ComponentType } from 'react'

export type Category = 'cursor'|'typography'|'simulation'|'others'

export type Experiment = {
    slug: string            
    title:string           
    category: Category          
    date: string           
    dateSort: string            
    description: string            
    component:   ComponentType<any> 
    contentPath: string          
}

export type CategoryMeta = {
    slug:  Category
    label: string      
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
    cursor: { slug:  'cursor', label: '# cursor'},
    typography: { slug:  'typography', label: '# typography'},
    simulation: { slug:  'simulation', label: '# simulation'},
    others: { slug:  'others', label: '# others' },
}

export function getExperiment(
    experiments: Experiment[],
    slug: string,
): Experiment | undefined {
    return experiments.find(e => e.slug === slug)
}

export function getByCategory(
    experiments: Experiment[],
    category: Category,
): Experiment[] {
    return experiments.filter(e => e.category === category)
}

export function getAdjacentExperiments(
    experiments: Experiment[],
    slug: string,
    category: Category,
): { prev: Experiment | null; next: Experiment | null } {
    const list = getByCategory(experiments, category)
    const idx  = list.findIndex(e => e.slug === slug)
    return {
        prev: idx > 0 ? list[idx - 1] : null,
        next: idx < list.length - 1 ? list[idx + 1] : null,
    }
}