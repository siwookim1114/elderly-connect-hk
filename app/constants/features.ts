import { Feature } from '../../types';

export const FEATURES: Feature[] = [
  {
    id: "voice",
    icon: "🎙️",
    title: "home.Ting",
    subtitle: "home.tingSubtitle",
    color: "#B4D7F1",
    route: "/voice-companion",
  },
  {
    id: "memory",
    icon: "📸",
    title: "home.memoryGarden",
    subtitle: "home.memorySubtitle",
    color: "#FFD9A0",
    route: "/memory-garden",
    badge: "NEW",
  },
  {
    id: "activity",
    icon: "🎯",
    title: "home.Haven",
    subtitle: "home.havenSubtitle",
    color: "#B8E6C9",
    route: "/ActivityDiscovery",
  },
];