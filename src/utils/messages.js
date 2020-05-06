const generateMessage = (username, text, createdAt = new Date().getTime()) => {
    return { username, text, createdAt };
};

module.exports = {
    generateMessage,
};