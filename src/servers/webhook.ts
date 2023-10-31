import express from 'express';
import { DOMAIN_NAME, SERVER_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_KEY, isProd } from "../constants";
import { handleCharge } from "../services/payment";

export const stripe = require('stripe')(STRIPE_SECRET_KEY);
const webhookServer = async () => {
    const app = express();
    app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
        const sig = request.headers['stripe-signature'];

        let event;
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_WEBHOOK_KEY);
        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCharge(event);
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        response.send(200)
    });

    app.listen(4242, () => console.log(`Server listening running ${isProd ? 'https://' + DOMAIN_NAME + '4242' : 'http://localhost:4242/webhook'}`));
}

export default webhookServer;