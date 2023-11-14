// Extracted function to capitalize event names
export const capitalizeEventName = (name: string) => {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

export const removeDuplicates = (arr: string[]) => {
    return [...new Set(arr)];
}