import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UNIHub API',
            version: '1.0.0',
            description: 'API documentation for UNIHub platform',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: [],
        }],
    },
    apis: ['./src/controllers/*.js', './src/routes/*.js'],
}

export const specs = swaggerJsdoc(options);