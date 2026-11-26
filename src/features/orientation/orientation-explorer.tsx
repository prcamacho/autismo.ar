"use client";
import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Stethoscope,
  GraduationCap,
  FileText,
  Bus,
  UsersRound,
  Sprout,
} from "lucide-react";
import type { Place } from "@/features/locations/model";
import { PlacePicker } from "@/features/services/search-form";
import { orientationTopics } from "./topics";
import styles from "@/components/ui.module.css";

const icons = {
  health: Stethoscope,
  school: GraduationCap,
  document: FileText,
  transport: Bus,
  community: UsersRound,
  life: Sprout,
};
export function OrientationExplorer() {
  const [province, setProvince] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const locationFields = useRef<HTMLDivElement>(null);
  function href(category: string, age = "") {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (age) params.set("edad", age);
    if (province) params.set("province", province);
    if (province && place?.province === province) params.set("place", place.id);
    return `/directorio?${params}`;
  }
  function validateLocation(event: MouseEvent<HTMLAnchorElement>) {
    const invalidInput =
      locationFields.current?.querySelector<HTMLInputElement>("input:invalid");
    if (invalidInput) {
      event.preventDefault();
      invalidInput.reportValidity();
    }
  }
  return (
    <div className={styles.stack}>
      <div className={styles.callout}>
        <strong>Elegí una zona, si te sirve</strong>
        <p>
          Para incluir una localidad, seleccionala de la lista. Los resultados
          también incluyen recursos nacionales y provinciales pertinentes.
        </p>
        <div className="form-grid" ref={locationFields}>
          <PlacePicker
            province={province}
            onProvinceChange={setProvince}
            onPlaceChange={setPlace}
          />
        </div>
      </div>
      <div className={styles.cards}>
        {orientationTopics.map((topic) => {
          const Icon = icons[topic.icon];
          return (
            <article key={topic.id} className={styles.card}>
              <span className="icon-box">
                <Icon size={23} aria-hidden="true" />
              </span>
              <h2 style={{ fontSize: 21 }}>{topic.title}</h2>
              <p>
                <strong>{topic.question}</strong>
              </p>
              <p>{topic.description}</p>
              <Link
                className="text-link"
                href={href(topic.category, "age" in topic ? topic.age : "")}
                onClick={validateLocation}
                onAuxClick={validateLocation}
              >
                Explorar recursos <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {"related" in topic && (
                <Link
                  className="text-link"
                  href={href(topic.related)}
                  onClick={validateLocation}
                  onAuxClick={validateLocation}
                >
                  Ver centros y terapias
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
