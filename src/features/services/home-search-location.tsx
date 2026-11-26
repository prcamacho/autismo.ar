"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Place } from "@/features/locations/model";

const HomeSearchLocation = createContext<{
  province: string;
  setProvince: (province: string) => void;
  setPlace: (place: Place | null) => void;
  query: Record<string, string>;
} | null>(null);

export function useHomeSearchLocation() {
  return useContext(HomeSearchLocation);
}

export function HomeSearchLocationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [province, setProvince] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const query: Record<string, string> = {};
  if (province) query.province = province;
  if (province && place?.province === province) query.place = place.id;

  return (
    <HomeSearchLocation.Provider
      value={{ province, setProvince, setPlace, query }}
    >
      {children}
    </HomeSearchLocation.Provider>
  );
}

export function HomeDirectoryLink({
  category,
  className,
  children,
}: {
  category?: string;
  className: string;
  children: ReactNode;
}) {
  const location = useHomeSearchLocation();
  const query = { ...location?.query };
  if (category) query.categoria = category;
  return (
    <Link
      href={{ pathname: "/directorio", query }}
      className={className}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
