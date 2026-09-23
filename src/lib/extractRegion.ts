/*
Here, we can extract a named region by doing, for example:
            // region:config
            const CONFIG = { ... }
            // endregion:config
 */

export function extractRegion(source: string, region: string): string {
    const startMarker = `// region:${region}`
    const endMarker = `// endregion:${region}`

    const startIdx = source.indexOf(startMarker)
    const endIdx = source.indexOf(endMarker)

    if (startIdx === -1 || endIdx === -1) {
        throw new Error(
            `Hellooo, the region "${region}" not found. Expected markers "${startMarker}" / "${endMarker}" in the source file.`
        )
    }

    const raw = source.slice(startIdx + startMarker.length, endIdx)
    const lines = raw.replace(/^\n+|\n+$/g, '').split('\n')
    const indent = Math.min(...lines.filter(l => l.trim().length > 0).map(l => l.match(/^\s*/)?.[0].length ?? 0))
    return lines.map(l => l.slice(indent)).join('\n')
}
