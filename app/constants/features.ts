import { Feature } from '.';
export const FEATURES: Feature[] = [
  {
    id: "voice",
    icon: "🎙️",
    title: "home.Ting",
    subtitle: "home.tingSubtitle", 
    color: "#FED7D7",
    route: "/voice-companion",
  },
  {
    id: "memory", 
    icon: "📸",
    title: "home.memoryGarden",
    subtitle: "home.memorySubtitle",
    color: "#FEEBC8",
    route: "/memory-garden",
    badge: "NEW",
  },
  {
    id: "activity",
    icon: "🏢", // CHANGED ICON
    title: "home.CommunityCenter", // CHANGED TITLE KEY
    subtitle: "home.communitySubtitle", // CHANGED SUBTITLE KEY
    color: "#C6F6D5",
    route: "/ActivityDiscovery", // Keep same route or change to "/community-center"
  },
];