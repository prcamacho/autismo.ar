import { Heart, MapPin, Sprout } from "lucide-react";
import { PuzzleMark } from "@/components/puzzle-mark";

export function CommunityArt() {
  return (
    <div className="community-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-note note-top">
        <MapPin size={17} />
        <span>Cerca tuyo</span>
      </div>
      <div className="art-leaf">
        <Sprout strokeWidth={1.4} />
      </div>
      <div className="art-main">
        <span className="art-spark spark-one">✦</span>
        <PuzzleMark className="hero-puzzle" />
        <span className="art-spark spark-two">✦</span>
        <div className="art-caption">
          Cada aporte
          <br />
          <strong>nos acerca.</strong>
        </div>
      </div>
      <div className="art-note note-bottom">
        <div className="art-heart">
          <Heart size={20} />
        </div>
        <span>
          Un lugar para
          <br />
          <strong>acompañarnos</strong>
        </span>
      </div>
      <div className="art-dot dot-blue" />
      <div className="art-dot dot-yellow" />
      <div className="art-dot dot-coral" />
    </div>
  );
}
