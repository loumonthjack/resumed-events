import { RoleType } from "@prisma/client";

// Extracted function to capitalize event names
export const capitalizeName = (name: string) => {
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

export const removeDuplicates = (arr: string[]) => {
    return [...new Set(arr)];
}

export const getRoleName = (name: RoleType) => {
    switch (name) {
        case RoleType.ADMINISTRATOR:
            return "Administrator";
        case RoleType.COMPANY_AUDITOR:
            return "Supervisor";
        case RoleType.COMPANY_MANAGER:
            return "Manager";
        case RoleType.EVENT_AUDITOR:
            return "Event Supervisor";
        case RoleType.EVENT_MANAGER:
            return "Event Manager";
        default:
            throw new Error("Invalid role type");
    }
}