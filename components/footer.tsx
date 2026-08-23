"use client"

import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Separator className="mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <Link
              href="https://x.com/LoharTushal"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground font-medium"
            >
              Tushal Lohar
            </Link>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/rules" className="hover:text-foreground transition-colors">
              Rules
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span>
              Inspired by{" "}
              <a
                href="https://outbid.lol"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                outbid.lol
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}