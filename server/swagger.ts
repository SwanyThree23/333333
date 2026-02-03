import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SwanyThree AI Livestream API',
            version: '1.0.0',
            description: 'Enterprise-grade API for AI Avatar Livestreaming platform',
            contact: {
                name: 'API Support',
                email: 'support@swanythree.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-KEY',
                }
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./server/index.ts', './server/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options);
