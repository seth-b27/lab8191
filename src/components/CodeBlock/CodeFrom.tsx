import fs from 'fs/promises'
import path from 'path'
import CodeBlock from '@/components/CodeBlock/CodeBlock'
import {extractRegion} from '@/lib/extractRegion'

type CodeFromProps = {
    file: string
    region?: string
    lang?: string
}

// used inside .mdx content to pull code straight from the real source
export default async function CodeFrom({ file, region, lang = 'ts' }: CodeFromProps) {
    const fullPath = path.join(process.cwd(), 'src', 'experiments', file)
    const source = await fs.readFile(fullPath, 'utf8')
    const code = region ? extractRegion(source, region) : source.trim()

    return <CodeBlock code={code} language={lang} className="my-4" />
}
