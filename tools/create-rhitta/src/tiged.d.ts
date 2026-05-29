declare module 'tiged' {
  interface TigedOptions {
    cache?: boolean
    force?: boolean
    verbose?: boolean
  }

  interface TigedClone {
    clone(dest: string): Promise<void>
  }

  export default function tiged(src: string, opts?: TigedOptions): TigedClone
}
