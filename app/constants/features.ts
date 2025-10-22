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
    icon: "🏢",
    title: "home.CommunityCenter",
    subtitle: "home.communitySubtitle",
    color: "#C6F6D5",
    route: "/ActivityDiscovery",
  },
  {
    id: "help",
    icon: "💁",
    title: "home.helpDesk",
    subtitle: "home.helpDeskSubtitle",
    color: "#E9D8FD",
    route: "/help-desk",
  },
];