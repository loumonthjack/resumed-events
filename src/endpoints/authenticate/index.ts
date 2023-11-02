import { generateCUID } from "../../helper";

const auth = Router();

auth.post('/request-magic-link', async (req, res) => {
    const { email } = req.body;
    const organizer = await prisma.organizer.findUnique({ where: { email } });

    if (organizer) {
        const token = generateCUID();
        await prisma.magicLinkToken.create({
            data: {
                token,
                organizerId: organizer.id,
                validUntil: new Date(Date.now() + 3600000), // 1 hour validity
            },
        });

        // Send email with magic link
        const magicLink = `http://yourdomain.com/authenticate?token=${token}`;
        // Use nodemailer to send the email with magicLink
    }

    res.send('Magic link sent if the email is registered.');
});

// Endpoint to authenticate with the magic link
auth.get('/authenticate', async (req, res) => {
    const { token } = req.query;
    const magicToken = await prisma.magicLinkToken.findUnique({ where: { token } });

    if (magicToken && magicToken.validUntil > new Date()) {
        // Token is valid, authenticate the user
        // You can create a session or JWT token here
        res.send('Authenticated successfully.');
    } else {
        res.status(401).send('Invalid or expired token.');
    }
});