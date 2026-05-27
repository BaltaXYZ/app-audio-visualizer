import { useEffect, useState } from "react";

export function useAudioClock(audioElement: HTMLAudioElement | null) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!audioElement) {
      setCurrentTime(0);
      return;
    }

    let animationFrame = 0;
    let lastUpdate = 0;

    const update = () => setCurrentTime(audioElement.currentTime);

    const tick = (timestamp: number) => {
      if (timestamp - lastUpdate > 80) {
        lastUpdate = timestamp;
        update();
      }

      if (!audioElement.paused && !audioElement.ended) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    const start = () => {
      cancelAnimationFrame(animationFrame);
      update();
      animationFrame = requestAnimationFrame(tick);
    };

    audioElement.addEventListener("play", start);
    audioElement.addEventListener("pause", update);
    audioElement.addEventListener("ended", update);
    audioElement.addEventListener("seeked", update);
    audioElement.addEventListener("timeupdate", update);
    update();

    return () => {
      cancelAnimationFrame(animationFrame);
      audioElement.removeEventListener("play", start);
      audioElement.removeEventListener("pause", update);
      audioElement.removeEventListener("ended", update);
      audioElement.removeEventListener("seeked", update);
      audioElement.removeEventListener("timeupdate", update);
    };
  }, [audioElement]);

  return currentTime;
}
