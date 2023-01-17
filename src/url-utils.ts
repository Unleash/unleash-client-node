export function resolveUrl(from: string, to: string) {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl;
    return pathname + search + hash;
  }
  return resolvedUrl.toString();
}

const getUrl = (
  base: string,
  projectName?: string,
  namePrefix?: string,
  tags?: Array<string>,
): string => {
  const url = resolveUrl(base, './client/features');
  const params = new URLSearchParams();
  if (projectName) {
    params.append('project', projectName);
  }
  if (namePrefix) {
    params.append('namePrefix', namePrefix);
  }
  if (tags) {
    tags.forEach((tag) => params.append('tag', tag));
  }
  if (params.toString().length > 0) {
    return `${url}?${params.toString()}`;
  }
  return url;
};

export const suffixSlash = (url: string): string => (url.endsWith('/') ? url : `${url}/`);

export default getUrl;