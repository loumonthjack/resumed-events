import { type Request, Response } from "express";
import db, { prisma } from "./database";
import { Role, RoleType, UserRole } from "@prisma/client";
import { FULL_SERVER_URL } from "../constants";
import { GetMethodOperations, PostMethodOperations,  getMethodOperations,  operation, operations, postMethodOperations } from "./api.constants";
import { capitalizeName, getRoleName } from "../../helper";

const ERROR_MESSAGE = `Operation not found, please check the operations list at ${FULL_SERVER_URL}/operations`;
const NOT_AUTHORIZED_MESSAGE = "You are not authorized to perform this operation. Please try logging in again or contact support.";
const requiredFieldsMessage = (missingFields: string[]) => `Missing required fields: ${missingFields}`;

const authorizedUsers = (userRole: UserRole & { Role: Role }, authorizedRoles: RoleType[]) => {
    if (!userRole) return false;
    return authorizedRoles.includes(userRole.Role.name as RoleType);
}

const getOperations = async (
    req: Request,
    res: Response,
    userRole: UserRole & { Role: Role },
    operationName: GetMethodOperations,
) => {
    switch (operationName) {
        case operation.getUser: {
            const user = await db.get.user(userRole.userId);
            console.log("user", user)
            return res.json({ user });
        }
        case operation.getInvites: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const invites = await db.get.invitesByAccount(userRole.accountId);
            return res.json({ invites });
        }
        case operation.getEventAttendees: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR, RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { eventId } = req.body;
            if (authorizedUsers(userRole, [RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER])) {
                const attendees = await db.get.attendeesByEvent(userRole.eventId!);
                return res.json({ attendees });
            }
            if (!eventId) return res.status(400).json({ error: requiredFieldsMessage(["eventId"]) });
            const attendees = await db.get.attendeesByEvent(eventId);
            return res.json({ attendees });
        }
        case operation.getEventStaffMembers: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR, RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { eventId } = req.body;
            if (authorizedUsers(userRole, [RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER])) {
                const staffMembers = await db.get.userRolesByEvent(userRole.eventId!);
                return res.json({ staffMembers });
            }
            if (!eventId) return res.status(400).json({ error: requiredFieldsMessage(["eventId"]) });
            const staffMembers = await db.get.userRolesByEvent(eventId);
            return res.json({ staffMembers });

        }
        case operation.getStaffMembers: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const staffMembers = await db.get.userRolesByAccount(userRole.accountId);
            return res.json({ staffMembers });
        }
        case operation.getRoles: {
            const roles = await db.get.userRolesByUser(userRole.userId);
            return res.json({ roles: roles.map(role => ({ ...role, Role: { name: getRoleName(role.Role.name as RoleType) } })) });
        }
        case operation.getEvents: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { search, filter } = req.query;
            if (filter) {
                if (filter.toString() === "upcoming"){
                    const upcoming = await prisma.event.findMany({
                        where: {
                            accountId: userRole.accountId,
                            startDate: {
                                gt: new Date()
                            }
                        }
                    });
                    return res.json({ events: upcoming });
                }else if (filter.toString() === "archived"){
                    const past = await prisma.event.findMany({
                        where: {
                            accountId: userRole.accountId,
                            startDate: {
                                lt: new Date()
                            }
                        }
                    });
                    return res.json({ events: past });
                }
            }
            const events = await db.get.eventsByAccount(userRole.accountId, search as string);
            return res.json({ events });
        }
        case operation.getEvent: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR, RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { eventId } = req.query;
            if (authorizedUsers(userRole, [RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER])) {
                const event = await db.get.getEventById(userRole.eventId!);
                return res.json({ event });
            }
            if (!eventId) return res.status(400).json({ error: requiredFieldsMessage(["eventId"]) });
            const event = await db.get.getEventById(eventId.toString());
            return res.json({ event });
        }
        case operation.currentRole: {
            const role = await db.get.userRole(userRole.id);
            return res.json({ userRole: {
                ...role,
                Role: {
                    name: getRoleName(role?.Role.name as RoleType),
                }
            } });
        }
    }
}

const postOperations = async (
    req: Request,
    res: Response,
    userRole: UserRole & { Role: Role },
    operationName: PostMethodOperations,
) => {
    if (!userRole) return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
    switch (operationName) {
        case operation.updateUser: {
            const { firstName, lastName, email, profilePicture } = req.body;
            const updatedUser = await db.update.user(userRole.userId, { firstName, lastName, email, profilePicture });
            return res.json({ user: updatedUser });
        }
        case operation.searchEventAttendees: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR, RoleType.EVENT_AUDITOR, RoleType.EVENT_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { search } = req.body;
            if (!search) return res.status(400).json({ error: requiredFieldsMessage(["search"]) });
            const attendees = await db.search.attendees(search, userRole.eventId!);
            return res.json({ attendees });

        }
        case operation.searchEvents: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.COMPANY_AUDITOR]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { search, pagination } = req.body;
            if (!search) return res.status(400).json({ error: requiredFieldsMessage(["search"]) });
            const events = await db.get.eventsByAccount(userRole.accountId, search, pagination);
            return res.json({ events });
        }
        case operation.deleteEvent: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { eventId } = req.body;
            if (!eventId) return res.status(400).json({ error: requiredFieldsMessage(["eventId"]) });
            const event = await db.archive.event(eventId);
            return res.json({ event });
        }
        case operation.deleteInvite: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { inviteId } = req.body;
            if (!inviteId) return res.status(400).json({ error: requiredFieldsMessage(["inviteId"]) });
            const invite = await db.delete.invite(inviteId);
            return res.json({ invite });
        }
        case operation.switchRole: {
            const { userRoleId } = req.body;
            if (!userRoleId) return res.status(400).json({ error: requiredFieldsMessage(["userRoleId"]) });
            const updateRole = await db.update.role(userRole.userId!, userRoleId);
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
        case operation.createEvent: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }

            // Extract fields from request body
            const { name, description, startDate, endDate, logo, portalBackgroundImage, landingBackgroundImage, theme, configuration, invitees } = req.body;

            // Validate required fields
            const requiredFields = { name, description, startDate, endDate, configuration, invitees };
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);
            if (missingFields.length > 0) {
                return res.status(400).json({ error: requiredFieldsMessage(missingFields) });
            }

            // Create event
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
            res.json({ eventId: event.id });
        }
        case operation.createInvite: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { email, firstName, lastName, role, eventId } = req.body;
            const requiredFields = { email, role, eventId };
            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);
            if (missingFields.length > 0) return res.status(400).json({ error: requiredFieldsMessage(missingFields) });

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
        case operation.updateEvent: {
            const isAuthorized = authorizedUsers(userRole, [RoleType.ADMINISTRATOR, RoleType.COMPANY_MANAGER, RoleType.EVENT_MANAGER]);
            if (!isAuthorized) {
                return res.status(401).json({ error: NOT_AUTHORIZED_MESSAGE });
            }
            const { eventId, name, description, startDate, endDate, logo, portalBackgroundImage, landingBackgroundImage, theme, configuration, invitees } = req.body;
            if (authorizedUsers(userRole, [RoleType.EVENT_MANAGER])) {
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
            if (!eventId) return res.status(400).json({ error: requiredFieldsMessage(["eventId"]) });
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
        default:
            return res.status(404).json({ error: "Operation not found, please check the operations list at https://api.resumed.events/operations" });
    }
}

function apiAdapter(method: "get" | "post") {
    return async (req: Request, res: Response) => {
        if(!req.session?.userRoleId) return res.status(401).json({ error: "ERROR_314: You are not authorized to perform this operation." });
        const userRole: UserRole & { Role: Role } | null = await prisma.userRole.findUnique({
            where: {
                id: req.session?.userRoleId
            },
            include: {
                Role: true
            }
        });
        if (!userRole) return res.status(401).json({ error: "ERROR_316: You are not authorized to perform this operation." });
        
        const { operationName } = req.params;
        if (!operations.includes(operationName)) return res.status(404).json({ error: "ERROR_318: " + ERROR_MESSAGE });

        if (method === 'get') {
            if (!getMethodOperations.includes(operationName)) return res.status(404).json({ error: "ERROR_320: " + ERROR_MESSAGE });
            return getOperations(req, res, userRole, operationName as GetMethodOperations);
        }

        if (method === 'post') {
            if (!postMethodOperations.includes(operationName)) return res.status(404).json({ error: "ERROR_324: " + ERROR_MESSAGE });
            return postOperations(req, res, userRole, operationName as PostMethodOperations);
        }
        return res.status(404).json({ error: "ERROR_327:" + ERROR_MESSAGE });
    };
}

function helpHandler() {
    return async (req: Request, res: Response) => {
        const { operationName } = req.params;
        if (!operations.includes(operationName)) return res.json({ error: "ERROR_334: " + ERROR_MESSAGE });
        for (const operation of operations) {
            if (operation === operationName) {
                const url = `${FULL_SERVER_URL}/operation/${operationName}`
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
                                        "role": RoleType.EVENT_MANAGER
                                    },
                                    {
                                        "email": "event_staff_supervisor@gmail.com",
                                        "firstName": "Event",
                                        "lastName": "Staff Supervisor",
                                        "role": RoleType.EVENT_AUDITOR
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
                                method: "GET",
                                query: {
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
                                            role: RoleType.EVENT_MANAGER
                                        },
                                        {
                                            email: "event_staff_auditor@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Auditor",
                                            role: RoleType.EVENT_AUDITOR
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
                                method: "GET",
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
                                                role: RoleType.EVENT_MANAGER
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
                                                role: RoleType.EVENT_MANAGER
                                            },
                                            {
                                                email: "event_staff_auditor@gmail.com",
                                                firstName: "Event",
                                                lastName: "Staff Auditor",
                                                role: RoleType.EVENT_AUDITOR
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
                                            role: RoleType.EVENT_MANAGER
                                        },
                                        {
                                            email: "event_staff_auditor@gmail.com",
                                            firstName: "Event",
                                            lastName: "Staff Auditor",
                                            role: RoleType.EVENT_AUDITOR
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
        const search = req.query.search;
        const url = (operation: GetMethodOperations | PostMethodOperations) => `${FULL_SERVER_URL}/operation/${operation}`;
        if (search) {
            if (search === "get" || search === "get".toUpperCase()) return res.json({
                operations: getMethodOperations.map(operation => {
                    return {
                        operation,
                        url: url(operation),
                        method: "GET"
                    }
                })
            });
            if (search === "post" || search === "post".toUpperCase()) return res.json({
                operations: postMethodOperations.map(operation => {
                    return {
                        operation,
                        url: url(operation),
                        method: "POST"
                    }
                })
            });
            const filteredOperations = operations.filter(operation => operation.includes(search as string));
            return res.json({
                operations: filteredOperations.map(operation => {
                    return {
                        operation,
                        url: url(operation),
                        method: getMethodOperations.includes(operation) ? "GET" : "POST"
                    }
                })
            });
        }
        res.json({
            operations: operations.map(operation => {
                return {
                    operation,
                    url: url(operation),
                    method: getMethodOperations.includes(operation) ? "GET" : "POST"
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