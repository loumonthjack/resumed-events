const getMethodOperations: string[] = [
    "getUser",
    "getEvent",
    "getEvents",
    "getStaffMember",
    "getStaffMembers",
    "getEventStaffMember",
    "getEventStaffMembers",
    "getInvite",
    "getInvites",
    "getEventInvites",
    "getEventAttendee",
    "getEventAttendees",
    "getRoles",
    "currentRole",
];
const postMethodOperations: string[] = [
    "createEvent",
    "searchEvents",
    "updateEvent",
    "deleteEvent",
    "createInvite",
    "updateInvite",
    "deleteInvite",
    "createEventAttendee",
    "searchEventAttendees",
    "updateEventAttendee",
    "deleteEventAttendee",
    "updateUser",
    "updateConfiguration",
    "switchRole",
];

export type GetMethodOperations = typeof getMethodOperations[number];
export type PostMethodOperations = typeof postMethodOperations[number];

export type Operation = GetMethodOperations | PostMethodOperations;
export type Operations = Operation[];
export type OperationMap = { [key in Operation]: Operation };

const operations: Operations = [
    ...getMethodOperations,
    ...postMethodOperations
];

const operation: OperationMap = {
    getEvents: "getEvents",
    getEvent: "getEvent",
    searchEvents: "searchEvents",
    createEvent: "createEvent",
    updateEvent: "updateEvent",
    deleteEvent: "deleteEvent",
    getInvites: "getInvites",
    getInvite: "getInvite",
    createInvite: "createInvite",
    updateInvite: "updateInvite",
    deleteInvite: "deleteInvite",
    searchEventAttendees: "searchEventAttendees",
    getEventAttendees: "getEventAttendees",
    getEventAttendee: "getEventAttendee",
    createEventAttendee: "createEventAttendee",
    updateEventAttendee: "updateEventAttendee",
    deleteEventAttendee: "deleteEventAttendee",
    getEventStaffMembers: "getEventStaffMembers",
    getEventStaffMember: "getEventStaffMember",
    createEventStaffMember: "createEventStaffMember",
    updateEventStaffMember: "updateEventStaffMember",
    deleteEventStaffMember: "deleteEventStaffMember",
    getStaffMembers: "getStaffMembers",
    getStaffMember: "getStaffMember",
    createStaffMember: "createStaffMember",
    updateStaffMember: "updateStaffMember",
    deleteStaffMember: "deleteStaffMember",
    getUser: "getUser",
    getRoles: "getRoles",
    switchRole: "switchRole",
    currentRole: "currentRole",
};
export { operations, operation, getMethodOperations, postMethodOperations };