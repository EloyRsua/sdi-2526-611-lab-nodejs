const songRequestSchema = {
    type: 'object',
    required: ['title', 'kind', 'price'],
    properties: {
        title: {
            type: 'string',
            description: 'Título de la canción'
        },
        kind: {
            type: 'string',
            description: 'Género de la canción'
        },
        price: {
            type: 'number',
            description: 'Precio de la canción'
        }
    },
    example: {
        title: "Cuarto Movimiento: La Realidad",
        kind: "Rock",
        price: 18.0
    }
};
module.exports = {
    SongRequest: songRequestSchema
};
