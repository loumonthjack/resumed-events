import { DOMAIN_NAME, SERVER_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_KEY, isProd } from "../constants";
import { handleCharge } from "../services/payment";

export const stripe = require('stripe')(STRIPE_SECRET_KEY);

const webhookServer = async () => {
    const express = require('express');
    const app = express();


    // This is your Stripe CLI webhook secret for testing your endpoint locally.

    app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
        const sig = request.headers['stripe-signature'];

        let event;
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, STRIPE_WEBHOOK_KEY);
        } catch (err) {
            response.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }
        console.log('event', event)
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCharge(event);
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                // Then define and call a function to handle the event payment_intent.succeeded
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        response.send(200)
    });

    app.listen(4242, () => console.log(`Server listening running ${isProd ? 'https://' + DOMAIN_NAME + '4242' : 'http://localhost:4242'}`));
}

// RUN ONLY IF THIS IS THE MAIN FILE
if (require.main === module) {
    webhookServer();
}