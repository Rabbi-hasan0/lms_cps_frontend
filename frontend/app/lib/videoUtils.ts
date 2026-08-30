// app/lib/videoUtils.ts

// TypeScript-এ window.YT ডিক্লেয়ার করা
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// সেকেন্ডকে "15m", "1h 24m" বা "25s" ফরম্যাটে রূপান্তর
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '15m';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs}s`;
}

// YouTube Video ID বের করার নিখুঁত রেজেক্স (Watch, Short, Embed, Playlist সব লিংক সাপোর্ট করবে)
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
}

// ভিডিও লিংক থেকে Duration অটো বের করার ফাংশন
export async function getVideoDuration(videoUrl: string): Promise<string> {
  if (!videoUrl || typeof window === 'undefined') return '';

  const ytId = extractYouTubeId(videoUrl);

  // ১. যদি YouTube ভিডিও হয় (IFrame API দিয়ে Duration নেওয়া)
  if (ytId) {
    return new Promise((resolve) => {
      // YouTube IFrame API স্ক্রিপ্ট ইনজেক্ট করা (যদি আগে না থাকে)
      if (!window.YT) {
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }
      }

      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.opacity = '0';
      tempDiv.style.pointerEvents = 'none';
      tempDiv.style.width = '1px';
      tempDiv.style.height = '1px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      let player: any = null;
      let checkInterval: any = null;
      let hasResolved = false;

      const cleanup = () => {
        if (checkInterval) clearInterval(checkInterval);
        try {
          if (player && typeof player.destroy === 'function') {
            player.destroy();
          }
        } catch (_) {}
        if (tempDiv.parentNode) {
          tempDiv.remove();
        }
      };

      const safeResolve = (durationStr: string) => {
        if (!hasResolved) {
          hasResolved = true;
          cleanup();
          resolve(durationStr);
        }
      };

      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          checkInterval = null;

          try {
            player = new window.YT.Player(tempDiv, {
              videoId: ytId,
              playerVars: {
                autoplay: 0,
                controls: 0,
              },
              events: {
                onReady: (event: any) => {
                  try {
                    const dur = event.target.getDuration();
                    safeResolve(dur && dur > 0 ? formatDuration(dur) : '15m');
                  } catch (_) {
                    safeResolve('15m');
                  }
                },
                onError: () => {
                  safeResolve('15m');
                },
              },
            });
          } catch (_) {
            safeResolve('15m');
          }
        }
      }, 150);

      // ৫ সেকেন্ডের মধ্যে রেসপন্স না পেলে নিরাপদ ফলব্যাক
      setTimeout(() => {
        safeResolve('15m');
      }, 5000);
    });
  }

  // ২. যদি সরাসরি ভিডিও ফাইল (.mp4, .webm ইত্যাদি) হয়
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        resolve(formatDuration(video.duration));
      };

      video.onerror = () => {
        resolve('15m');
      };

      setTimeout(() => {
        resolve('15m');
      }, 5000);
    } catch (_) {
      resolve('15m');
    }
  });
}