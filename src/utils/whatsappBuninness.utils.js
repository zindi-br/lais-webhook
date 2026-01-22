


const transformAcks = (status) => {
    switch (status) {
        case 'sent':
            return 1;
        case 'delivered':
            return 'entregue';
        case 'read':
            return 'lido';
        default:
            return 'erro';
    }
}

const checkMediaMessage = (message) => {
    // Define a list of media types to check.
    const mediaTypes = ['image', 'audio', 'video', 'document'];

    // Check if the message type is one of the media types.
    if (mediaTypes.includes(message.type)) {
        // Extract the specific media based on the message type.
        const media = message[message.type];

        // For audio messages, return complete audio structure
        if (message.type === 'audio') {
            return {
                mime_type: media.mime_type,
                id: media.id,
                sha256: media.sha256,
                url: media.url,
                voice: media.voice
            };
        }

        // For document messages, return complete document structure
        if (message.type === 'document') {
            return {
                filename: media.filename,
                mime_type: media.mime_type,
                id: media.id,
                sha256: media.sha256,
                url: media.url
            };
        }

        // For video messages, return complete video structure
        if (message.type === 'video') {
            return {
                mime_type: media.mime_type,
                id: media.id,
                sha256: media.sha256,
                url: media.url
            };
        }

        // Return the common structure for other media types.
        return {
            mime_type: media.mime_type,
            id: media.id,
            sha256: media.sha256,
            url: media.url
        };
    }

    // Return 'erro' for unsupported message types.
    return 'erro';
}


module.exports = {
    checkMediaMessage
}