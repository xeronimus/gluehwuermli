/** small checks the validations of fixtures and scenes share */

export const isBlank = (text: string): boolean => text.trim().length === 0;

/** each value that occurs more than once, once */
export const duplicatesOf = <T>(values: readonly T[]): T[] => [
  ...new Set(values.filter((value, index) => values.indexOf(value) !== index))
];
