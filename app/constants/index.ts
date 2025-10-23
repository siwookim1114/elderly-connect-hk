export interface Feature {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  route: string;
  badge?: string;
}
export type Language = 'en' | 'zh';

// Default export for React Router compatibility
const constants = {
  Language: 'en' as Language
};

export default constants;