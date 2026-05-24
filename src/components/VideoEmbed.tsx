type Props = { url: string; title?: string; className?: string };

function toEmbed(url: string): { kind: "iframe" | "video"; src: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return { kind: "iframe", src: `https://www.youtube.com/embed/${v}` };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) {
      return { kind: "video", src: url };
    }
    return { kind: "iframe", src: url };
  } catch {
    return null;
  }
}

export function VideoEmbed({ url, title, className }: Props) {
  const e = toEmbed(url);
  if (!e) return null;
  if (e.kind === "video") {
    return (
      <video src={e.src} controls playsInline className={className ?? "w-full h-full object-cover"} />
    );
  }
  return (
    <iframe
      src={e.src}
      title={title ?? "Video"}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={className ?? "w-full h-full"}
    />
  );
}
