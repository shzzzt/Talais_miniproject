export function createPageUrl(pageName: string): string {
  if (pageName === 'Dashboard') return '/';
  return `/${pageName}`;
}