"use client";

import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";
import { track } from "@/lib/client/track";

type TrackedLinkProps = {
  href: string;
  event: string;
  props?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
  download?: boolean;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

export default function TrackedLink({
  href,
  event,
  props,
  className,
  children,
  download,
  target,
  rel,
  onClick,
}: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    track(event, props);
    onClick?.(e);
  };

  if (isInternalHref(href) && !download && !target) {
    return (
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      download={download}
      target={target}
      rel={rel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
