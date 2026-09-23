import type {Metadata} from 'next'
import {redirect, notFound } from 'next/navigation'
import {allExperiments } from '@/experiments'
import {CATEGORY_META, getByCategory, type Category } from '@/lib/experiments'

type Props ={params: Promise<{category: string}>}

export function generateStaticParams() {
    return Object.keys(CATEGORY_META).map(category => ({category}))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const {category} = await params
    return { title: category }
}

export default async function CategoryIndexPage({ params }: Props) {
    const { category } = await params
    const experiments = getByCategory(allExperiments, category as Category)
    if (experiments.length === 0) notFound()

    redirect(`/${category}/${experiments[0].slug}`)
}