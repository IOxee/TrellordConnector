var t = window.TrelloPowerUp.iframe();

document.getElementById('saveButton').addEventListener('click', function() {
    var webhookUrl = document.getElementById('webhookUrl').value;
    var boardId = document.getElementById('boardId').value;

    t.set('board', 'shared', { webhookUrl: webhookUrl, boardId: boardId })
        .then(function() {
            t.closePopup();
        });
});
