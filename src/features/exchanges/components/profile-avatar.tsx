"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "../exchanges.module.css";

export function ProfileAvatar({
  id,
  name,
  hasPhoto,
}: {
  id: string;
  name: string;
  hasPhoto: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return hasPhoto && !failed ? (
    <Image
      src={`/api/exchanges/photos/${id}`}
      width={80}
      height={80}
      unoptimized
      alt=""
      className={styles.avatar}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={styles.avatar} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
