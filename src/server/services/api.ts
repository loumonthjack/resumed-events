import { type Request, Response } from "express";
import db, { prisma } from "./database";
const operations = [
    "getUser", // done
    "createEvent", // done
    "searchEvents", // done
    "getEvent", // done
    "getEvents", // done
    "updateEvent", // done
    "deleteEvent", // done
    "getStaffMember",
    "getStaffMembers", // done
    "removeStaffMember",
    "getEventStaffMember",
    "getEventStaffMembers", // done
    "createInvite", // done
    "getRoles", // done
    "currentRole", // done
    "switchRole", // done
    "getInvite",
    "getInvites", // done
    "getEventInvites", // done
    "updateInvite",
    "deleteInvite", // done
    "createEventAttendee",
    "searchEventAttendees",
    "getEventAttendee",
    "getEventAttendees", // done
    "updateEventAttendee",
    "deleteEventAttendee",
    "updateUser",
    "updateConfiguration",
];
function apiAdapter() {
    return async (req: Request, res: Response) => {
        const userRole = await prisma.userRole.findUnique({
            where: {
                id: req.session?.userRoleId
            },
            include: {
                Role: true
            }
        });
        switch (req.params.operationName) {
            case "getUser":{
               const user = await prisma.user.findUnique({
                    where: {
                        id: userRole?.userId
                    }
                });
                return res.json({ user });
            }
            case "searchEventAttendees": {
                const { search } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER" || userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                    if (!search) return res.status(400).json({ error: "Missing required fields: search" });
                    const attendees = await db.search.attendees(search, userRole?.eventId!);
                    return res.json({ attendees });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "searchEvents": {
                const { search } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    if (!search) return res.status(400).json({ error: "Missing required fields: search" });
                    const events = await db.search.events(search, userRole?.accountId!);
                    return res.json({ events });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "deleteEvent": {
                const { eventId } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId" });
                    const event = await db.archive.event(eventId);
                    return res.json({ event });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "deleteInvite": {
                const { inviteId } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    if (!inviteId) return res.status(400).json({ error: "Missing required fields: inviteId" });
                    const invite = await db.delete.invite(inviteId);
                    return res.json({ invite });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getEventInvites": {
                const { eventId } = req.body;
                if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId, inviteId" });
                const invites = await prisma.invite.findMany({
                    where: {
                        eventId
                    }
                });
                return res.json({ invites });
            }
            case "getInvites": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    const invites = await db.get.invitesByAccount(userRole.accountId);
                    return res.json({ invites });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getEventAttendees": {
                const { eventId } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER" || userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                    if (userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                        const attendees = await db.get.attendeesByEvent(userRole.eventId!);
                        return res.json({ attendees });
                    }
                    if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId" });
                    const attendees = await db.get.attendeesByEvent(eventId);
                    return res.json({ attendees });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getEventStaffMembers": {
                const { eventId } = req.body;
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER" || userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                    if (userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                        const staffMembers = await db.get.userRolesByEvent(userRole.eventId!);
                        return res.json({ staffMembers });
                    }
                    if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId" });
                    const staffMembers = await db.get.userRolesByEvent(eventId);
                    return res.json({ staffMembers });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getStaffMembers": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    const staffMembers = await db.get.userRolesByAccount(userRole.accountId);
                    return res.json({ staffMembers });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getRoles": {
                const roles = await prisma.userRole.findMany({
                    where: {
                        userId: userRole?.userId
                    },
                    include: {
                        Role: true
                    }
                });
                return res.json({ roles });
            }
            case "currentRole": {
                if (userRole) {
                    const getRole = await prisma.userRole.findUnique({
                        where: {
                            id: userRole.id
                        },
                        include: {
                            Role: true,
                            Account: true
                        }
                    });
                    return res.json({ userRole: getRole });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "switchRole": {
                const { userRoleId } = req.body;
                if (!userRoleId) return res.status(400).json({ error: "Missing required fields: userRoleId" });
                const updateRole = await db.update.role(userRole?.userId!, userRoleId);
                const newRole = await prisma.userRole.findUnique({
                    where: {
                        id: updateRole.id
                    },
                    include: {
                        Role: true
                    }
                });
                return res.json({ role: newRole?.Role.name });
            }
            case "createEvent": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    const { name, description, startDate, endDate, logo, portalBackgroundImage, landingBackgroundImage, theme, configuration, invitees } = req.body;
                    if (!name || !description || !startDate || !endDate || !configuration || !invitees) {
                        let missingFields = [];
                        if (!name) missingFields.push("name");
                        if (!description) missingFields.push("description");
                        if (!startDate) missingFields.push("startDate");
                        if (!endDate) missingFields.push("endDate");
                        if (!theme) missingFields.push("theme");
                        if (!configuration) missingFields.push("configuration");
                        if (!invitees) missingFields.push("invitees");
                        return res.status(400).json({ error: `Missing required fields: ${missingFields}` });
                    }

                    const event = await db.create.event({
                        name,
                        description,
                        startDate,
                        endDate,
                        logo,
                        portalBackgroundImage,
                        landingBackgroundImage,
                        theme,
                        configuration,
                        invitees,
                        accountId: userRole.accountId
                    });
                    return res.json({ eventId: event.id });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getEvents": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    const events = await db.get.eventsByAccount(userRole.accountId);
                    return res.json({ events });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "getEvent": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_AUDITOR" || userRole?.Role.name === "COMPANY_MANAGER" || userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                    // check if EVENT_AUDITOR or EVENT_MANAGER has access to event
                    const { eventId } = req.body;
                    if (userRole?.Role.name === "EVENT_AUDITOR" || userRole?.Role.name === "EVENT_MANAGER") {
                        const event = await db.get.getEventById(userRole.eventId!);
                        return res.json({ event });
                    }
                    if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId" });
                    const event = await db.get.getEventById(eventId);
                    return res.json({ event });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "createInvite": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_MANAGER") {
                    const { email, firstName, lastName, role, eventId } = req.body;
                    if (!email || !role) {
                        let missingFields = [];
                        if (!email) missingFields.push("email");
                        if (!role) missingFields.push("role");
                        if (!eventId) missingFields.push("eventId");
                        return res.status(400).json({ error: `Missing required fields: ${missingFields}` });
                    }
                    const invite = await db.create.invite({
                        email,
                        firstName,
                        lastName,
                        role,
                        accountId: userRole.accountId,
                        eventId
                    });
                    return res.json({ inviteId: invite.id });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });
            }
            case "updateEvent": {
                if (userRole?.Role.name === "ADMINISTRATOR" || userRole?.Role.name === "COMPANY_MANAGER" || userRole?.Role.name === "EVENT_MANAGER") {
                    const { eventId, name, description, startDate, endDate, logo, portalBackgroundImage, landingBackgroundImage, theme, configuration, invitees } = req.body;
                    if (userRole?.Role.name === "EVENT_MANAGER") {
                        const updatedEvent = await db.update.event(userRole.eventId!, {
                            name,
                            description,
                            startDate,
                            endDate,
                            logo,
                            portalBackgroundImage,
                            landingBackgroundImage,
                            theme,
                            configuration,
                            invitees
                        });
                        return res.json({ event: updatedEvent });
                    }
                    if (!eventId) return res.status(400).json({ error: "Missing required fields: eventId" });
                    const updatedEvent = await db.update.event(eventId, {
                        name,
                        description,
                        startDate,
                        endDate,
                        logo,
                        portalBackgroundImage,
                        landingBackgroundImage,
                        theme,
                        configuration,
                        invitees
                    });
                    return res.json({ event: updatedEvent });
                }
                return res.status(401).json({ error: "You are not authorized to perform this operation." });

            }
            default:
                return res.status(404).json({ error: "Operation not found, please check the operations list at https://api.resumed.events/operations" });
        }
    };
}

function helpHandler() {
    return async (req: Request, res: Response) => {
        const { operationName } = req.params;
        if (!operations.includes(operationName)) return res.json({ error: "Operation not found, please check the operations list at https://api.resumed.events/operations" });
        for (const operation of operations) {
            if (operation === operationName) {
                const url = `https://api.resumed.events/operation/${operationName}`
                if (operation === "createEvent") {
                    return res.json({
                        operation,
                        exampleRequest: {
                            url,
                            method: "POST",
                            note: "The accountId is loaded from logged in user and create event will be owned by account. This operation will create an event, with event configuration, invite staff members and add attendees to notify list then return the event id.",
                            body: {
                                "name": "Event Name",
                                "description": "Event Description",
                                "startDate": "2021-09-01T12:00:00.000Z",
                                "endDate": "2021-09-01T12:00:00.000Z",
                                "logo": "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                "portalBackgroundImage": "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/portalBackgroundImage.png",
                                "landingBackgroundImage": "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/landingBackgroundImage.png",
                                "theme": "LIGHT",
                                "configuration": {
                                    "showSlideControls": true,
                                    "showAttendeeLeaderboard": true,
                                    "enableEarlyAccess": true,
                                    "setLimit": 250,
                                    "attendeeData": [
                                        "firstName",
                                        "lastName",
                                        "email",
                                        "company",
                                        "title",
                                        "What is your favorite color?"
                                    ]
                                },
                                "invitees": [
                                    {
                                        "email": "event_staff_manager@gmail.com",
                                        "firstName": "Event",
                                        "lastName": "Staff Manager",
                                        "role": "EVENT_MANAGER"
                                    },
                                    {
                                        "email": "event_staff_supervisor@gmail.com",
                                        "firstName": "Event",
                                        "lastName": "Staff Supervisor",
                                        "role": "EVENT_AUDITOR"
                                    },
                                    {
                                        "email": "event_attendee@gmail.com",
                                        "role": "ATTENDEE"
                                    }
                                ]
                            }
                        },
                        exampleResponse: {
                            eventId: "2"
                        }
                    });
                }
                if (operation === "getEvent") {
                    return res.json({
                        operation,
                        exampleRequest: {
                            request: {
                                url,
                                method: "POST",
                                body: {
                                    eventId: "2"
                                }
                            },
                            notes: "The $eventId are required. The accountId is loaded from logged in user and returns event that owned by account.The $eventId is the event id of the event to get. This operation will return the event.",
                        },
                        exampleResponse: {
                            response: {
                                event: {
                                    id: "2",
                                    name: "Event Name",
                                    description: "Event Description",
                                    startDate: "2021-09-01T12:00:00.000Z",
                                    endDate: "2021-09-01T12:00:00.000Z",
                                    logo: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                    portalBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/portalBackgroundImage.png",
                                    landingBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/landingBackgroundImage.png",
                                    theme: "LIGHT",
                                    configuration: {
                                        showSlideControls: true,
                                        showAttendeeLeaderboard: true,
                                        enableEarlyAccess: true,
                                        setLimit: 250,
                                        attendeeData: [
                                            "firstName",
                                            "lastName",
                                            "email",
                                            "company",
                                            "title",
                                            "What is your favorite color?"
                                        ]
                                    },
                                    invitees: [
                                        {
                                            email: "event_staff_manager@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Manager",
                                            role: "EVENT_MANAGER"
                                        },
                                        {
                                            email: "event_staff_auditor@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Auditor",
                                            role: "EVENT_AUDITOR"
                                        },
                                        {
                                            email: "event_attendee@gmail.com",
                                            role: "ATTENDEE"
                                        }
                                    ]
                                }
                            }
                        }
                    });
                }
                if (operation === "getEvents") {
                    return res.json({
                        operation,
                        exampleRequest: {
                            request: {
                                url,
                                method: "POST",
                            },
                            note: "The accountId is loaded from logged in user and returns events that owned by account. This operation will return the events.",
                        },
                        exampleResponse: {
                            response: {
                                events: [
                                    {
                                        id: "1",
                                        name: "Event Name",
                                        description: "Event Description",
                                        startDate: "2021-09-01T12:00:00.000Z",
                                        endDate: "2021-09-01T12:00:00.000Z",
                                        logo: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                        portalBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/portalBackgroundImage.png",
                                        landingBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/landingBackgroundImage.png",
                                        theme: "DARK",
                                        configuration: {
                                            showSlideControls: true,
                                            showAttendeeLeaderboard: false,
                                            enableEarlyAccess: false,
                                            setLimit: 175,
                                            attendeeData: [
                                                "email",
                                                "company",
                                                "title",
                                            ]
                                        },
                                        invitees: [
                                            {
                                                email: "event_staff_manager@gmail.com",
                                                firstName: "Event",
                                                lastName: "Staff Manager",
                                                role: "EVENT_MANAGER"
                                            },
                                            {
                                                email: "event_attendee@gmail.com",
                                                role: "ATTENDEE"
                                            },
                                            {
                                                email: "another_event_attendee@gmail.com",
                                                role: "ATTENDEE"
                                            }
                                        ]
                                    },
                                    {
                                        id: "2",
                                        name: "Event Name",
                                        description: "Event Description",
                                        startDate: "2021-09-02T12:00:00.000Z",
                                        endDate: "2021-09-02T12:00:00.000Z",
                                        logo: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                        portalBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/portalBackgroundImage.png",
                                        landingBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/landingBackgroundImage.png",
                                        theme: "LIGHT",
                                        configuration: {
                                            showSlideControls: true,
                                            showAttendeeLeaderboard: true,
                                            enableEarlyAccess: true,
                                            setLimit: 250,
                                            attendeeData: [
                                                "firstName",
                                                "lastName",
                                                "email",
                                                "company",
                                                "title",
                                                "What is your favorite color?"
                                            ]
                                        },
                                        invitees: [
                                            {
                                                email: "event_staff_manager@gmail.com",
                                                firstName: "Event",
                                                lastName: "Staff Manager",
                                                role: "EVENT_MANAGER"
                                            },
                                            {
                                                email: "event_staff_auditor@gmail.com",
                                                firstName: "Event",
                                                lastName: "Staff Auditor",
                                                role: "EVENT_AUDITOR"
                                            },
                                            {
                                                email: "event_attendee@gmail.com",
                                                role: "ATTENDEE"
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    });
                }
                if (operation === "updateEvent") {
                    return res.json({
                        operation,
                        exampleRequest: {
                            note: "The $accountId and $eventId are required. The $accountId is the account id of the account that owns the event. The $eventId is the event id of the event to update. Provide only changing data in body of request. This operation will update the event.",
                            request: {
                                url,
                                method: "POST",
                                body: {
                                    "description": "Event Description",
                                    "logo": "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                    "theme": "LIGHT",
                                    "configuration": {
                                        "setLimit": 400,
                                    },
                                    invites: [
                                        {
                                            email: "add_another_event_attendee@gmail.com",
                                            role: "ATTENDEE"
                                        }
                                    ] /* gets added to existing invites*/
                                }
                            }
                        },
                        exampleResponse: {
                            response: {
                                event: {
                                    id: "2",
                                    name: "Event Name",
                                    description: "Event Description",
                                    startDate: "2021-09-01T12:00:00.000Z",
                                    endDate: "2021-09-01T12:00:00.000Z",
                                    logo: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/logo.png",
                                    portalBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/portalBackgroundImage.png",
                                    landingBackgroundImage: "https://resumed-events.s3.us-east-2.amazonaws.com/event/1/landingBackgroundImage.png",
                                    theme: "LIGHT",
                                    configuration: {
                                        showSlideControls: true,
                                        showAttendeeLeaderboard: true,
                                        enableEarlyAccess: true,
                                        setLimit: 400,
                                        attendeeData: [
                                            "firstName",
                                            "lastName",
                                            "email",
                                            "company",
                                            "title",
                                            "What is your favorite color?"
                                        ]
                                    },
                                    invitees: [
                                        {
                                            email: "event_staff_manager@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Manager",
                                            role: "EVENT_MANAGER"
                                        },
                                        {
                                            email: "event_staff_auditor@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Auditor",
                                            role: "EVENT_AUDITOR"
                                        },
                                        {
                                            email: "event_attendee@gmail.com",
                                            role: "ATTENDEE"
                                        },
                                        {
                                            email: "add_anotther_event_attendee@gmail.com",
                                            role: "ATTENDEE"
                                        }
                                    ]
                                }
                            }
                        }
                    });
                }
            }
        }
    };
}

function listHandler() {
    return async (req: Request, res: Response) => {
        res.json({
            operations: operations.map(operation => {
                return {
                    operation,
                    url: `https://api.resumed.events/operation/${operation}`
                }
            })
        });
    };
}

export default {
    helpHandler,
    listHandler,
    adapterHandler: apiAdapter
}