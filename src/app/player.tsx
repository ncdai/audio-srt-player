"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SubtitleLine {
  start: number;
  end: number;
  text: string;
}

function toSeconds(timeStr: string): number {
  const [h, m, sMs] = timeStr.split(":");
  const [s, ms] = sMs.split(",");
  return (
    parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000
  );
}

function parseSRT(srt: string): SubtitleLine[] {
  const lines = srt.trim().split(/\r?\n/);
  const subs: SubtitleLine[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }
    i++; // skip subtitle number
    const time = lines[i++];
    const [startStr, endStr] = time.split(" --> ");
    const start = toSeconds(startStr);
    const end = toSeconds(endStr);
    let text = "";
    while (i < lines.length && lines[i].trim()) {
      text += lines[i++] + " ";
    }
    subs.push({ start, end, text: text.trim() });
    i++;
  }
  return subs;
}

export function AudioSRTPlayer() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubtitleLine[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleSrtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setSubs(parseSRT(content));
      };
      reader.readAsText(file);
    }
  };

  const handleSubtitleClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
    }
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="mb-4 text-2xl font-bold">Audio + SRT Player</h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">Upload Audio File</label>
            <Input type="file" accept="audio/*" onChange={handleAudioUpload} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold">Upload SRT File</label>
            <Input type="file" accept=".srt" onChange={handleSrtUpload} />
          </div>
        </div>

        <div>
          {subs.map((line, index) => {
            const isActive = currentTime >= line.start && currentTime <= line.end;

            return (
              <div
                key={index}
                className={cn("cursor-pointer rounded-lg p-2 transition", {
                  "ring-2 ring-blue-600 font-medium": isActive,
                })}
                onClick={() => handleSubtitleClick(line.start)}
              >
                <div>{line.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
          <audio ref={audioRef} className="w-full" controls src={audioUrl} />
        </div>
      )}
    </>
  );
}
