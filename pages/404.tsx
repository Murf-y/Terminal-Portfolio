import Head from 'next/head'
import Link from 'next/link'

export default function FourOhFour(): React.ReactElement {
  return (
    <>
      <Head>
        <title>404 — Not Found</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center stagger-children">
          <h1 className="font-display text-[clamp(7rem,22vw,16rem)] leading-none text-text tracking-tight">
            4<span className="text-accent">0</span>4
          </h1>
          <p className="font-mono text-[13px] text-muted mt-6 mb-14">
            This page doesn&apos;t exist. Maybe it never did.
          </p>
          <Link
            href="/"
            className="inline-block font-mono text-[11px] text-void bg-accent px-8 py-3 hover:opacity-80 transition-opacity duration-200 tracking-[0.2em] uppercase font-semibold"
          >
            Go Home
          </Link>
        </div>
      </div>
    </>
  )
}
