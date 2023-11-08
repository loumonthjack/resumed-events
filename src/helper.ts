import cuid from 'cuid';
export const generateCUID = (prefix?: string) => {
    return prefix ? prefix + '_' + cuid() : cuid();
};

// Extracted function to capitalize event names
export const capitalizeName = (name: string) => {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

export const removeDuplicates = (arr: string[]) => {
    return [...new Set(arr)];
}
