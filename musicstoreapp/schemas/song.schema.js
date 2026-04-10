const songSchema = {
    type: 'object',
    properties: {
        _id: { type: 'string', description: 'ID único' },
        title: { type: 'string', description: 'Título' },
        kind: { type: 'string', description: 'Género de la canción' },
        price: { type: 'number', description: 'Precio de la canción' },
        author: { type: 'string', description: 'Autor de la canción' }
    },
    example: {
        _id: "69c6905f5e4e6f21b204e672",
        title: "Cuarto Movimiento: La Realidad",
        kind: "Rock",
        price: 18.0,
        author: "Extremoduro"
    }
};
module.exports = {
    Song: songSchema
};
