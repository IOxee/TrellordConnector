module.exports = {
    trellos: [
        {
            boardName: 'ROADMAP',
            boardId: '......', // This is the board trello id
            disableComments: false, // This is to disable the comments in the console
            timer_duration: 20 * 60 * 1000, // 20 minutes in milliseconds
            check_interval: 5 * 60 * 1000, // 5 minutes in milliseconds
            discord_configs: {
                mentions: ['@everyone'],
                webhookUrl: 'https://discord.com/api/webhooks/..../....',
                username: 'TrellordConnector - ROADMAP', // Optional: Username of the Webhook User
                avatar_url: '.....', // Optional: Link to a image file
            }
        }
    ],
};
