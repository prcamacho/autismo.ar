"use client";
import { useState } from "react";
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
import { PROVINCES } from "@/lib/geography";
import { orientationTopics } from "./topics";
import styles from "@/features/community/community.module.css";

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
  const [locality, setLocality] = useState("");
  function href(category: string, age = "") {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (age) params.set("edad", age);
    if (province) params.set("provincia", province);
    if (province && locality.trim()) params.set("localidad", locality.trim());
    return `/directorio?${params}`;
  }
  return (
    <div className={styles.stack}>
      <div className={styles.callout}>
        <strong>Elegí una zona, si te sirve</strong>
        <p>
          También vas a encontrar recursos nacionales y provinciales que
          correspondan.
        </p>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="orientation-province">Provincia</label>
            <select
              id="orientation-province"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                setLocality("");
              }}
            >
              <option value="">Todo el país</option>
              {PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="orientation-locality">Localidad (opcional)</label>
            <input
              id="orientation-locality"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              disabled={!province}
              maxLength={120}
              placeholder={
                province ? "Escribí tu localidad" : "Elegí una provincia"
              }
            />
          </div>
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
              >
                Explorar recursos <ArrowRight size={16} aria-hidden="true" />
              </Link>
              {"related" in topic && (
                <Link className="text-link" href={href(topic.related)}>
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
