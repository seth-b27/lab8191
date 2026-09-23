import type {Metadata} from 'next'
import path from 'path'
import fs from 'fs/promises'
import {cache} from 'react'
import {notFound} from 'next/navigation'
import {MDXRemote} from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm' 

import CategoryLayout from '@/components/CategoryLayout/CategoryLayout'
import {mdxComponents} from '@/components/mdxComponents'
import {allExperiments } from '@/experiments'
import {getExperiment, getByCategory, type Category } from '@/lib/experiments'

type Props ={params: Promise<{ category: string; slug: string }>}

const readContent =cache(async (contentPath: string) =>{
    return fs.readFile(
        path.join(process.cwd(),'src', 'experiments', contentPath), 'utf8'
    )
})

export function generateStaticParams(){
    return allExperiments.map(e => ({category: e.category, slug: e.slug}))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category, slug } = await params
    const exp = getExperiment(allExperiments, slug)
    if (!exp || exp.category !== category) return {}
    return { title: exp.title }
}

export default async function ExperimentPage({ params }: Props) {
    const { category, slug} = await params
    const exp = getExperiment(allExperiments, slug)
    // Guards against cross-category URL spoofing, e.g. /typography/pixel
    // (a real slug, wrong category). just in case. i think without this it would still resolve?
    if (!exp || exp.category !== category) notFound()

    const experiments = getByCategory(allExperiments, category as Category)
    // nav only ever needs slug/title
    const navExperiments = experiments.map(({slug, title}) => ({slug, title}))
    const source = await readContent(exp.contentPath)
    const mdxContent = <MDXRemote source={source} components={mdxComponents} 
                            options={{ mdxOptions: {remarkPlugins: [remarkGfm]}}}/>

    const ActiveComponent = exp.component
    const demoElement = <ActiveComponent/>

    return (
        <CategoryLayout
            category={category as Category}
            experiments={navExperiments}
            activeSlug={slug}
            activeTitle={exp.title}
            demoElement={demoElement}
            mdxContent={mdxContent}
        />
    )
}