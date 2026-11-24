/**
 * Desktop Notification & Web Audio Chime Utility
 * Allows popup notifications outside the browser window and audio feedback
 */

// Request Notification Permission
export const requestDesktopNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
};

// Check if desktop notification is supported and allowed
export const isNotificationAllowed = () => {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
};

// Send a Desktop Notification popup
export const showDesktopNotification = (title, options = {}) => {
  if (!isNotificationAllowed()) {
    return null;
  }

  try {
    const defaultOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false,
    };

    const notification = new Notification(title, {
      ...defaultOptions,
      ...options,
    });

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    // Auto-close after 8 seconds if not interacted
    setTimeout(() => {
      try {
        notification.close();
      } catch (e) {}
    }, 8000);

    return notification;
  } catch (err) {
    console.warn('Desktop notification display failed:', err);
    return null;
  }
};

// Synthetic Web Audio Chime (No external audio file needed)
export const playTimerChime = (type = 'chime') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start' || type === 'resume') {
      // Ascending pleasant arpeggio
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'pause') {
      // Gentle descending two-tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2); // A4
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'complete' || type === 'target') {
      // Victory double chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'alert') {
      // Soft ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    // Audio context may be restricted by autoplay policy before user gesture
  }
};
