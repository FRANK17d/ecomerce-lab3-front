"use client";

import Image from "next/image";
import { useState } from "react";

const NEXT_IMAGE_HOSTS = new Set(["cdn.dummyjson.com"]);

function canUseNextImage(src: string) {
  try {
    return NEXT_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

export function ProductImage({
  src,
  alt,
  className = "",
  fill,
  sizes,
  priority,
  loading,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const placeholderClass = fill
      ? `absolute inset-0 grid place-items-center bg-[var(--soft-cloud)] text-xs text-[var(--mute)] ${className}`
      : `grid place-items-center bg-[var(--soft-cloud)] text-xs text-[var(--mute)] ${className}`;

    return <div className={placeholderClass}>Sin imagen</div>;
  }

  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill={fill}
        sizes={sizes}
        priority={priority}
        loading={loading}
        onError={() => setFailed(true)}
      />
    );
  }

  const imgClass = fill ? `absolute inset-0 h-full w-full object-contain ${className}` : className;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={imgClass}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
