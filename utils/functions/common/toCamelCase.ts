export const toCamelCase = (str: string): string => {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, (match) => match.toLowerCase());
};
